// POST { sheetUrl } -> fetches a Google Sheets "publish to web" CSV export,
// parses it with a small dependency-free CSV parser, and upserts any rows
// that don't already exist into the wanderline-leads store (deduped by
// phone, falling back to name+destination when phone is blank).
//
// Returns { imported: [...newLeadObjects], skipped: N, recognizedColumns: [...] }

const { jsonResponse, preflightResponse, readAll, writeAll } = require("./lib/util");

const LEADS_STORE = "wanderline-leads";
const ACTIVITY_STORE = "wanderline-activity";

// Minimal CSV parser: handles commas, double-quoted fields, and escaped ""
// inside quotes. Not fully RFC 4180 (no multi-line quoted fields across
// otherwise-split rows edge cases beyond the basics), but good enough for
// a Google Sheets CSV export.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  // Normalize line endings
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        pushField();
      } else if (c === "\n") {
        pushField();
        pushRow();
      } else {
        field += c;
      }
    }
  }
  // last field/row (if any content remains)
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }
  // drop fully empty trailing rows
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Map recognized header names (case-insensitive, tolerant of spacing) to
// our internal lead field names.
const HEADER_MAP = {
  name: "name",
  "traveller name": "name",
  "traveler name": "name",
  "full name": "name",
  destination: "destination",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  "whatsapp": "phone",
  "whatsapp number": "phone",
  "travel window": "travelWindow",
  "travelwindow": "travelWindow",
  "travel dates": "travelWindow",
  budget: "budget",
  "approx budget": "budget",
  "approx. budget": "budget",
  "referred by": "referredBy",
  referredby: "referredBy",
  source: "source",
};

function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/\s+/g, " ");
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return preflightResponse();
    if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

    const body = JSON.parse(event.body || "{}");
    const sheetUrl = body.sheetUrl;
    if (!sheetUrl || typeof sheetUrl !== "string") {
      return jsonResponse(400, { error: "sheetUrl is required — publish your Google Sheet to the web as CSV and paste that link." });
    }

    let csvText;
    try {
      const resp = await fetch(sheetUrl);
      if (!resp.ok) {
        return jsonResponse(400, { error: `Could not fetch the sheet (HTTP ${resp.status}). Make sure it's published to the web as CSV.` });
      }
      csvText = await resp.text();
    } catch (fetchErr) {
      return jsonResponse(400, { error: "Could not reach that URL: " + (fetchErr.message || String(fetchErr)) });
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      return jsonResponse(200, { imported: [], skipped: 0, recognizedColumns: [], note: "Sheet appears empty." });
    }

    const headerRow = rows[0];
    const colIndexToField = {};
    const recognizedColumns = [];
    headerRow.forEach((h, i) => {
      const key = normalizeHeader(h);
      const field = HEADER_MAP[key];
      if (field) {
        colIndexToField[i] = field;
        recognizedColumns.push(`${h.trim()} -> ${field}`);
      }
    });

    const dataRows = rows.slice(1);

    const existingLeads = await readAll(LEADS_STORE, []);
    const activity = await readAll(ACTIVITY_STORE, []);

    const byPhone = new Map();
    const byNameDest = new Map();
    for (const l of existingLeads) {
      if (l.phone) byPhone.set(l.phone.trim(), l);
      byNameDest.set(`${(l.name || "").trim().toLowerCase()}|${(l.destination || "").trim().toLowerCase()}`, l);
    }

    const imported = [];
    let skipped = 0;
    const nowTs = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

    for (const row of dataRows) {
      const rec = {};
      row.forEach((cell, i) => {
        const field = colIndexToField[i];
        if (field) rec[field] = (cell || "").trim();
      });

      if (!rec.name && !rec.destination) { skipped++; continue; }

      const phoneKey = rec.phone ? rec.phone.trim() : "";
      const nameDestKey = `${(rec.name || "").trim().toLowerCase()}|${(rec.destination || "").trim().toLowerCase()}`;

      const isDup = (phoneKey && byPhone.has(phoneKey)) || (!phoneKey && byNameDest.has(nameDestKey));
      if (isDup) { skipped++; continue; }

      const id = "L" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      const newLead = {
        id,
        name: rec.name || "Unknown",
        destination: rec.destination || "TBD",
        pax: 1,
        phone: rec.phone || "",
        sellingPrice: Number(String(rec.budget || "").replace(/[^\d.]/g, "")) || 0,
        cost: 0,
        referredBy: rec.referredBy || "Google Sheet",
        source: rec.source || "Google Sheet",
        stage: "New Inquiry",
        lost: false,
        date: "Today",
        travelWindow: rec.travelWindow || "TBD",
        log: [],
      };

      existingLeads.unshift(newLead);
      imported.push(newLead);
      if (phoneKey) byPhone.set(phoneKey, newLead);
      byNameDest.set(nameDestKey, newLead);

      activity.unshift({
        id: "A" + Date.now() + Math.random().toString(36).slice(2, 5),
        text: `New lead synced from Sheet — ${newLead.name}, ${newLead.destination}`,
        ts: nowTs,
      });
    }

    if (imported.length > 0) {
      await writeAll(LEADS_STORE, existingLeads);
      await writeAll(ACTIVITY_STORE, activity);
    }

    return jsonResponse(200, { imported, skipped, recognizedColumns });
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
