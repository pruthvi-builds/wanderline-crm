// GET -> returns the WhatsApp outbox array, most recent first.
const { jsonResponse, preflightResponse, readAll } = require("./lib/util");

const OUTBOX_STORE = "wanderline-whatsapp-outbox";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();
    if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Method not allowed" });

    const outbox = await readAll(OUTBOX_STORE, []);
    return jsonResponse(200, outbox);
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
