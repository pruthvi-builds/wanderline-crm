// POST { leadId, phone, message, leadName } ->
// If WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars are both set,
// sends a real message via the Meta WhatsApp Cloud API and records status
// "sent". If either is missing, NO network call is made — we record an
// honest "simulated" outbox entry instead. We never pretend a message went
// out when it didn't.
const { jsonResponse, preflightResponse, readAll, writeAll } = require("./lib/util");

const OUTBOX_STORE = "wanderline-whatsapp-outbox";
const ACTIVITY_STORE = "wanderline-activity";

const NOT_CONNECTED_NOTE = "WhatsApp Business API not connected yet — add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Netlify env vars to send for real";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();
    if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

    const body = JSON.parse(event.body || "{}");
    const { leadId, phone, message, leadName } = body;
    if (!phone || !message) {
      return jsonResponse(400, { error: "phone and message are required" });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const configured = !!(token && phoneNumberId);

    const nowTs = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    const id = "W" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);

    let outboxEntry;

    if (configured) {
      try {
        const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: message },
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          outboxEntry = { id, leadId, phone, message, status: "sent", ts: nowTs, note: "Sent via Meta WhatsApp Cloud API." };
        } else {
          outboxEntry = { id, leadId, phone, message, status: "failed", ts: nowTs, note: `Meta API error: ${data.error?.message || resp.statusText}` };
        }
      } catch (sendErr) {
        outboxEntry = { id, leadId, phone, message, status: "failed", ts: nowTs, note: "Network error calling Meta API: " + (sendErr.message || String(sendErr)) };
      }
    } else {
      // Not configured: do NOT attempt a network call. Be explicit that
      // this is simulated, not a real send.
      outboxEntry = { id, leadId, phone, message, status: "simulated", ts: nowTs, note: NOT_CONNECTED_NOTE };
    }

    const outbox = await readAll(OUTBOX_STORE, []);
    outbox.unshift(outboxEntry);
    await writeAll(OUTBOX_STORE, outbox);

    const activity = await readAll(ACTIVITY_STORE, []);
    const who = leadName || phone;
    activity.unshift({
      id: "A" + Date.now(),
      text: outboxEntry.status === "sent"
        ? `WhatsApp sent to ${who}`
        : outboxEntry.status === "simulated"
          ? `WhatsApp simulated (not connected) for ${who}`
          : `WhatsApp send failed for ${who}`,
      ts: nowTs,
    });
    await writeAll(ACTIVITY_STORE, activity);

    return jsonResponse(200, outboxEntry);
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
