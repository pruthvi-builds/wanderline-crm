// GET  -> returns all quotations as an array
// POST -> upserts one quotation (body = full quotation object with an `id`)
const { jsonResponse, preflightResponse, readAll, writeAll } = require("./lib/util");

const STORE_NAME = "wanderline-quotations";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();

    if (event.httpMethod === "GET") {
      const quotations = await readAll(STORE_NAME, []);
      return jsonResponse(200, quotations);
    }

    if (event.httpMethod === "POST") {
      const incoming = JSON.parse(event.body || "{}");
      if (!incoming || !incoming.id) {
        return jsonResponse(400, { error: "Quotation payload must include an id" });
      }
      const quotations = await readAll(STORE_NAME, []);
      const idx = quotations.findIndex((q) => q.id === incoming.id);
      if (idx === -1) {
        quotations.unshift(incoming);
      } else {
        quotations[idx] = { ...quotations[idx], ...incoming };
      }
      await writeAll(STORE_NAME, quotations);
      return jsonResponse(200, { ok: true, quotation: incoming });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
