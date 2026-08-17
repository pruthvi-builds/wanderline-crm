// GET  -> returns all invoices as an array
// POST -> upserts one invoice (body = full invoice object with an `id`)
const { jsonResponse, preflightResponse, readAll, writeAll } = require("./lib/util");

const STORE_NAME = "wanderline-invoices";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();

    if (event.httpMethod === "GET") {
      const invoices = await readAll(STORE_NAME, []);
      return jsonResponse(200, invoices);
    }

    if (event.httpMethod === "POST") {
      const incoming = JSON.parse(event.body || "{}");
      if (!incoming || !incoming.id) {
        return jsonResponse(400, { error: "Invoice payload must include an id" });
      }
      const invoices = await readAll(STORE_NAME, []);
      const idx = invoices.findIndex((i) => i.id === incoming.id);
      if (idx === -1) {
        invoices.unshift(incoming);
      } else {
        invoices[idx] = { ...invoices[idx], ...incoming };
      }
      await writeAll(STORE_NAME, invoices);
      return jsonResponse(200, { ok: true, invoice: incoming });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
