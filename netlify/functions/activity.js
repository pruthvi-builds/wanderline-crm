// GET  -> returns activity feed array, most recent first
// POST -> appends one entry (body = { text } or a full entry with id/ts)
const { jsonResponse, preflightResponse, readAll, writeAll } = require("./lib/util");

const STORE_NAME = "wanderline-activity";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();

    if (event.httpMethod === "GET") {
      const activity = await readAll(STORE_NAME, []);
      return jsonResponse(200, activity);
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.text) {
        return jsonResponse(400, { error: "Activity payload must include text" });
      }
      const entry = {
        id: body.id || "A" + Date.now(),
        text: body.text,
        ts: body.ts || new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
      };
      const activity = await readAll(STORE_NAME, []);
      activity.unshift(entry);
      await writeAll(STORE_NAME, activity);
      return jsonResponse(200, { ok: true, entry });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
