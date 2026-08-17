// GET  -> returns all leads as an array
// POST -> upserts one lead (body = full lead object with an `id`); creates
//         it if the id isn't found yet, otherwise replaces the existing one.
const { jsonResponse, preflightResponse, readAll, writeAll } = require("./lib/util");

const STORE_NAME = "wanderline-leads";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();

    if (event.httpMethod === "GET") {
      const leads = await readAll(STORE_NAME, []);
      return jsonResponse(200, leads);
    }

    if (event.httpMethod === "POST") {
      const incoming = JSON.parse(event.body || "{}");
      if (!incoming || !incoming.id) {
        return jsonResponse(400, { error: "Lead payload must include an id" });
      }
      const leads = await readAll(STORE_NAME, []);
      const idx = leads.findIndex((l) => l.id === incoming.id);
      if (idx === -1) {
        leads.unshift(incoming);
      } else {
        leads[idx] = { ...leads[idx], ...incoming };
      }
      await writeAll(STORE_NAME, leads);
      return jsonResponse(200, { ok: true, lead: incoming });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
