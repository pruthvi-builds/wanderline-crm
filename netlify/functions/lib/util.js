// Shared helpers for Netlify Functions (CommonJS v1 handler style).
// Lives under netlify/functions/lib/ so Netlify's function bundler does not
// treat this file itself as a deployable function (only top-level files in
// netlify/functions/ become endpoints).

const { getStore } = require("@netlify/blobs");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

function preflightResponse() {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: "",
  };
}

// Every Blobs interaction goes through one JSON blob per store, keyed "all".
// Netlify Blobs has no transactions — fine for a single-editor demo CRM,
// not meant for high-concurrency production writes.
function store(name) {
  return getStore(name);
}

async function readAll(storeName, fallback) {
  const s = store(storeName);
  const raw = await s.get("all", { type: "json" });
  return raw || fallback;
}

async function writeAll(storeName, value) {
  const s = store(storeName);
  await s.setJSON("all", value);
  return value;
}

module.exports = { CORS_HEADERS, jsonResponse, preflightResponse, store, readAll, writeAll };
