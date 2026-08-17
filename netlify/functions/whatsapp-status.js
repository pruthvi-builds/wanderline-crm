// GET -> { configured: boolean }. Never returns the actual token/secret.
const { jsonResponse, preflightResponse } = require("./lib/util");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();
    if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Method not allowed" });

    const configured = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    return jsonResponse(200, { configured });
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
