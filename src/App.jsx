import React, { useState, useEffect } from "react";
import {
  LayoutGrid, Users, Briefcase, Bell, IndianRupee, Plus, X,
  Phone, MessageCircle, Mail, MapPin, ChevronRight,
  ChevronLeft, Check, Plane, Search, Truck, Star, Clock,
  FileText, UserPlus, Building2, Car, Receipt, TrendingUp,
  Settings, RefreshCw, Send
} from "lucide-react";

/* ---------------------------------------------------------------
   BACKEND API HELPERS — Netlify Functions + Netlify Blobs.
   Every read falls back to the local mock data if the function isn't
   reachable (e.g. running `vite dev` locally without `netlify dev`),
   so local development keeps working exactly as before.
----------------------------------------------------------------*/
async function apiGet(path, fallback) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch {
    return fallback;
  }
}

async function apiPost(path, payload) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("bad response");
    return await res.json();
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------
   TOKENS — navy / parchment / brass / teal / stamp red
   Signature element: boarding-pass ticket card, reused for every
   trip-shaped record (leads, bookings, client history).
----------------------------------------------------------------*/
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
:root{
  --ink:#14213D; --ink-soft:#2B3550; --paper:#F1F0E7; --paper-card:#FBFAF5;
  --brass:#B8863B; --brass-dark:#8F6A2C; --teal:#1F5C5C; --teal-soft:#E4EEEC;
  --stamp:#A6402E; --stamp-soft:#F3E1DB; --line:#DAD6C6; --text:#26261F; --text-mute:#6B6858;
}
.font-display{font-family:'Fraunces',serif;}
.font-body{font-family:'Inter',sans-serif;}
.font-mono{font-family:'IBM Plex Mono',monospace;}
.ticket{ position:relative; }
.ticket::before, .ticket::after{
  content:''; position:absolute; width:16px; height:16px; border-radius:50%;
  background:var(--paper); top:50%; transform:translateY(-50%);
}
.ticket::before{ left:-8px; } .ticket::after{ right:-8px; }
.perf{ border-left: 2px dashed var(--line); }
.stamp-badge{
  transform: rotate(-7deg); border: 2px solid currentColor; border-radius: 6px;
  font-family:'IBM Plex Mono',monospace; letter-spacing:0.08em;
}
.route-dots{
  background-image: radial-gradient(var(--text-mute) 1.5px, transparent 1.5px);
  background-size: 7px 2px; background-repeat: repeat-x; background-position: center; height:2px;
}
::-webkit-scrollbar{ width:8px; height:8px; }
::-webkit-scrollbar-thumb{ background:var(--line); border-radius:8px; }
`;

/* ---------------------------------------------------------------
   MOCK DATA
----------------------------------------------------------------*/
const STAGES = ["New Inquiry", "Contacted", "Quotation Sent", "Booking Confirmed", "Completed & Reviewed"];

const initialLeads = [
  { id: "L1", name: "Rohan Deshmukh", destination: "Goa", pax: 4, phone: "", sellingPrice: 65000, cost: 47000, referredBy: "Website Form", source: "Website", stage: "New Inquiry", lost: false, date: "2026-08-14", travelWindow: "Oct 2026", log: [] },
  { id: "L2", name: "Sneha Kulkarni", destination: "Bali", pax: 2, phone: "", sellingPrice: 145000, cost: 101000, referredBy: "Instagram DM", source: "Instagram", stage: "Contacted", lost: false, date: "2026-08-12", travelWindow: "Dec 2026", log: [
    { id: "n1", channel: "Call", note: "Discussed 6N/7D honeymoon package, sending quote by Fri.", ts: "12 Aug, 4:10 PM" },
  ]},
  { id: "L3", name: "Imran Shaikh", destination: "Kerala Backwaters", pax: 6, phone: "", sellingPrice: 98000, cost: 71000, referredBy: "Farah Ansari (past client)", source: "Referral", stage: "Quotation Sent", lost: false, date: "2026-08-10", travelWindow: "Sep 2026", log: [
    { id: "n2", channel: "WhatsApp", note: "Shared houseboat + Munnar itinerary PDF manually.", ts: "10 Aug, 11:02 AM" },
    { id: "n3", channel: "Call", note: "Family wants a day added in Alleppey — revising quote.", ts: "11 Aug, 6:40 PM" },
  ]},
  { id: "L4", name: "Priya & Karthik", destination: "Ladakh", pax: 2, phone: "", sellingPrice: 110000, cost: 79000, referredBy: "Google Business Profile", source: "Website", stage: "Booking Confirmed", lost: false, date: "2026-08-05", travelWindow: "Sep 2026", log: [
    { id: "n4", channel: "Email", note: "Advance received, confirming bike + Khardung La permit.", ts: "6 Aug, 9:20 AM" },
  ]},
  { id: "L5", name: "Aditya Rane", destination: "Dubai", pax: 3, phone: "", sellingPrice: 180000, cost: 132000, referredBy: "IndiaMART inquiry", source: "IndiaMART", stage: "Contacted", lost: true, date: "2026-07-29", travelWindow: "Aug 2026", log: [
    { id: "n5", channel: "Call", note: "Went with a cheaper package from another agent.", ts: "1 Aug, 2:15 PM" },
  ]},
  { id: "L6", name: "Meera Joshi", destination: "Andaman Islands", pax: 5, phone: "", sellingPrice: 220000, cost: 158000, referredBy: "Website Form", source: "Website", stage: "New Inquiry", lost: false, date: "2026-08-15", travelWindow: "Nov 2026", log: [] },
];

const initialBookings = [
  { id: "B1", name: "Priya & Karthik", destination: "Ladakh", depart: "12 Sep 2026", ret: "19 Sep 2026", pax: 2, amount: 110000, paid: 40000, status: "Advance Paid" },
  { id: "B2", name: "The Bhosale Family", destination: "Manali – Kasol", depart: "2 Sep 2026", ret: "7 Sep 2026", pax: 5, amount: 92000, paid: 92000, status: "Fully Paid" },
  { id: "B3", name: "Farah Ansari", destination: "Kerala Backwaters", depart: "28 Aug 2026", ret: "2 Sep 2026", pax: 2, amount: 68000, paid: 20000, status: "Advance Paid" },
];

const initialClients = [
  { id: "C1", name: "Priya & Karthik", trips: 2, ltv: 195000, last: "Ladakh — Sep 2026" },
  { id: "C2", name: "The Bhosale Family", trips: 1, ltv: 92000, last: "Manali – Kasol — Sep 2026" },
  { id: "C3", name: "Farah Ansari", trips: 3, ltv: 210000, last: "Kerala Backwaters — Aug 2026" },
  { id: "C4", name: "Sneha Kulkarni", trips: 1, ltv: 0, last: "Bali — Quote sent" },
];

const initialFollowups = [
  { id: "F1", name: "Sneha Kulkarni", task: "Send revised Bali honeymoon quote", channel: "WhatsApp", due: "Today", done: false },
  { id: "F2", name: "Imran Shaikh", task: "Confirm Alleppey day-add pricing", channel: "Call", due: "Today", done: false },
  { id: "F3", name: "Rohan Deshmukh", task: "First follow-up on Goa inquiry", channel: "WhatsApp", due: "Tomorrow", done: false },
  { id: "F4", name: "Farah Ansari", task: "Collect balance payment before departure", channel: "Call", due: "18 Aug", done: false },
  { id: "F5", name: "Aditya Rane", task: "Check back in 3 months for future travel", channel: "Email", due: "12 Nov", done: false },
];

const initialSuppliers = [
  { id: "S1", name: "Blue Lagoon DMC", type: "DMC", contact: "Wayan Putra", phone: "+62 812-xxxx-xxxx", email: "ops@bluelagoondmc.com", terms: "50% advance, balance on arrival", pendingDue: 42000, dueDate: "25 Aug 2026", rating: 4, linkedBookings: ["Bali — Sneha Kulkarni (quoted)"], notes: "Fast WhatsApp replies, reliable for honeymoon packages." },
  { id: "S2", name: "Himalayan Trailblazers", type: "Local Operator", contact: "Tenzin Dorje", phone: "+91 98xxxxxx21", email: "tenzin@htrailblazers.in", terms: "Full payment 7 days before departure", pendingDue: 65000, dueDate: "5 Sep 2026", rating: 5, linkedBookings: ["Ladakh — Priya & Karthik"], notes: "Best bike + permit handling in Leh." },
  { id: "S3", name: "Kerala Backwater Stays", type: "Hotel Chain", contact: "Sajan Thomas", phone: "+91 94xxxxxx08", email: "reservations@keralabackwaterstays.com", terms: "30% advance", pendingDue: 18000, dueDate: "20 Aug 2026", rating: 4, linkedBookings: ["Kerala Backwaters — Farah Ansari", "Kerala Backwaters — Imran Shaikh (quoted)"], notes: "Houseboat availability tight in peak season — book 3 weeks ahead." },
  { id: "S4", name: "Sahyadri Travels (Transport)", type: "Transport", contact: "Ganesh Patil", phone: "+91 90xxxxxx77", email: "ganesh@sahyadritravels.com", terms: "Per-trip, on completion", pendingDue: 0, dueDate: "—", rating: 4, linkedBookings: ["Manali – Kasol — The Bhosale Family"], notes: "Own fleet of Tempo Travellers, good for group bookings." },
];

const initialHotels = [
  { id: "H1", name: "Sunset Cliff Villas", destination: "Bali", category: "Luxury", roomTypes: "Private Pool Villa, Garden Suite", negotiatedRate: 8500, rackRate: 12000, contact: "reservations@sunsetcliffbali.com · +62 813-xxxx-xxxx", cancellation: "Free cancellation up to 7 days before check-in" },
  { id: "H2", name: "Backwater Heritage Resort", destination: "Kerala Backwaters", category: "Mid", roomTypes: "Lake View Room, Houseboat Cabin", negotiatedRate: 4200, rackRate: 5800, contact: "Sajan Thomas · +91 94xxxxxx08", cancellation: "50% refund if cancelled 3+ days prior" },
  { id: "H3", name: "Zostel Ladakh", destination: "Ladakh", category: "Budget", roomTypes: "Dorm Bed, Private Cottage", negotiatedRate: 1600, rackRate: 2200, contact: "bookings@zostelladakh.com", cancellation: "Non-refundable within 48 hrs" },
  { id: "H4", name: "Anjuna Beach Retreat", destination: "Goa", category: "Mid", roomTypes: "Sea View Room, Beach Hut", negotiatedRate: 3800, rackRate: 5200, contact: "Rahul Fernandes · +91 98xxxxxx45", cancellation: "Free cancellation up to 48 hrs before check-in" },
  { id: "H5", name: "Havelock Coral Bay", destination: "Andaman Islands", category: "Luxury", roomTypes: "Ocean Cottage, Family Suite", negotiatedRate: 9200, rackRate: 13500, contact: "stays@havelockcoralbay.in", cancellation: "Free cancellation up to 10 days before check-in" },
  { id: "H6", name: "Palm Jumeirah Suites", destination: "Dubai", category: "Luxury", roomTypes: "Deluxe Suite, Marina View Room", negotiatedRate: 11500, rackRate: 16000, contact: "groups@paljumeirahsuites.ae", cancellation: "Non-refundable rate — advance booking only" },
];

const initialFleet = [
  { id: "V1", name: "Sahyadri Travels — Tempo Traveller", type: "Tempo Traveller", capacity: 12, perDayRate: 4500, perKmRate: 18, status: "Available", bookingDates: "" },
  { id: "V2", name: "Ganesh Patil — Innova Crysta", type: "SUV", capacity: 6, perDayRate: 3200, perKmRate: 14, status: "On Trip", bookingDates: "2–7 Sep 2026 (Manali – Kasol)" },
  { id: "V3", name: "Leh Valley Motors — Sedan", type: "Sedan", capacity: 4, perDayRate: 2500, perKmRate: 12, status: "Available", bookingDates: "" },
  { id: "V4", name: "Konkan Coachlines — 20-Seater Bus", type: "Bus", capacity: 20, perDayRate: 9000, perKmRate: 32, status: "Maintenance", bookingDates: "" },
];

let qtCounter = 103;
const initialQuotations = [
  { id: "QT-2026-101", leadName: "Imran Shaikh", destination: "Kerala Backwaters", amount: 98000, status: "Sent", created: "10 Aug 2026", validUntil: "24 Aug 2026" },
  { id: "QT-2026-102", leadName: "Sneha Kulkarni", destination: "Bali", amount: 145000, status: "Draft", created: "12 Aug 2026", validUntil: "26 Aug 2026" },
];

let invCounter = 102;
const initialInvoices = [
  { id: "INV-2026-101", bookingName: "Priya & Karthik", destination: "Ladakh", amount: 110000, paid: 40000, status: "Partial", dueDate: "5 Sep 2026" },
];

const initialActivity = [
  { id: "A1", text: "Payment received from The Bhosale Family — ₹92,000 (Manali – Kasol)", ts: "Today, 10:05 AM" },
  { id: "A2", text: "Booking confirmed — Priya & Karthik, Ladakh", ts: "6 Aug, 9:22 AM" },
  { id: "A3", text: "Quotation sent to Imran Shaikh — Kerala Backwaters", ts: "10 Aug, 11:02 AM" },
  { id: "A4", text: "New inquiry — Meera Joshi, Andaman Islands", ts: "15 Aug, 3:40 PM" },
];

const channelIcon = { Call: Phone, WhatsApp: MessageCircle, Email: Mail };
const channelColor = { Call: "var(--teal)", WhatsApp: "#3D8B63", Email: "var(--brass-dark)" };
const money = (n) => "₹" + n.toLocaleString("en-IN");
const now = () => new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/* ---------------------------------------------------------------
   SMALL PIECES
----------------------------------------------------------------*/
function StampBadge({ text, color = "var(--teal)" }) {
  return <span className="stamp-badge inline-block px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color }}>{text}</span>;
}

function RouteLine({ to }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <span className="text-[11px] font-mono text-[var(--text-mute)] whitespace-nowrap">PUNE</span>
      <div className="flex-1 route-dots" />
      <Plane size={13} style={{ color: "var(--brass-dark)" }} />
      <div className="flex-1 route-dots" />
      <span className="text-[11px] font-mono uppercase whitespace-nowrap" style={{ color: "var(--ink)" }}>{to}</span>
    </div>
  );
}

function TicketCard({ title, sub, destination, meta, stamp, stampColor, onClick, children }) {
  return (
    <div onClick={onClick} className="ticket bg-[var(--paper-card)] rounded-lg shadow-sm border border-[var(--line)] overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-display text-[16px] font-semibold text-[var(--ink)] leading-tight">{title}</div>
            <div className="text-[12px] text-[var(--text-mute)] mt-0.5">{sub}</div>
          </div>
          {stamp && <StampBadge text={stamp} color={stampColor} />}
        </div>
        <RouteLine to={destination} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {meta.map((m, i) => <span key={i} className="text-[11px] font-mono text-[var(--text-mute)]">{m}</span>)}
        </div>
      </div>
      {children && <div className="perf px-4 py-2 bg-[var(--paper)]/60 text-[11px]">{children}</div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4 flex-1 min-w-[150px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">{label}</span>
        <Icon size={15} style={{ color: "var(--brass-dark)" }} />
      </div>
      <div className="font-display text-[24px] font-semibold text-[var(--ink)] mt-1">{value}</div>
      {hint && <div className="text-[11px] text-[var(--text-mute)] mt-0.5">{hint}</div>}
    </div>
  );
}

function Stars({ n }) {
  return (
    <span style={{ color: "var(--brass)" }} className="text-[12px]">
      {"★".repeat(n)}<span style={{ color: "var(--line)" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

function QuickActions({ onNewInquiry, onNewSupplier, onNewQuotation, onNewInvoice }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onNewInquiry} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--ink)", color: "white" }}>
        <UserPlus size={13} /> New Inquiry
      </button>
      <button onClick={onNewSupplier} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
        <Truck size={13} /> Add Supplier
      </button>
      <button onClick={onNewQuotation} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
        <FileText size={13} /> Send Quotation
      </button>
      <button onClick={onNewInvoice} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
        <Receipt size={13} /> Create Invoice
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------
   NEW INQUIRY MODAL — this is your "website form" lead capture.
   Same fields you'd put on a public landing page; here it's wired
   straight into the pipeline so you can demo the flow today.
----------------------------------------------------------------*/
function NewInquiryModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", destination: "", pax: 2, phone: "", budget: "", travelWindow: "", referredBy: "", source: "Website" });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-xl shadow-xl border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-card)] rounded-t-xl flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-[var(--ink)]">New inquiry</div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-[var(--text-mute)] -mt-1">These are the exact fields a public "Plan my trip" form on your website or Instagram bio link would collect — filled here to demo the flow.</p>
          {[
            { k: "name", label: "Traveller name", ph: "e.g. Ankita Verma" },
            { k: "phone", label: "Phone / WhatsApp number", ph: "e.g. +91 98xxxxxx21" },
            { k: "destination", label: "Destination", ph: "e.g. Vietnam" },
            { k: "travelWindow", label: "Travel window", ph: "e.g. Dec 2026" },
            { k: "budget", label: "Approx. budget (₹)", ph: "e.g. 85000" },
            { k: "referredBy", label: "Referred by / source detail", ph: "e.g. Instagram ad, friend's name" },
          ].map(f => (
            <div key={f.k}>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">{f.label}</label>
              <input
                value={form[f.k]}
                onChange={e => set(f.k, e.target.value)}
                placeholder={f.ph}
                className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]"
              />
            </div>
          ))}
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Pax</label>
            <input type="number" min={1} value={form.pax} onChange={e => set("pax", e.target.value)} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <button
            onClick={() => { if (form.name && form.destination) onCreate(form); }}
            className="w-full text-[13px] font-medium py-2 rounded flex items-center justify-center gap-1.5"
            style={{ background: "var(--brass)", color: "white" }}
          >
            <Plus size={14} /> Add to pipeline
          </button>
        </div>
      </div>
    </div>
  );
}

function NewSupplierModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", type: "DMC", contact: "", phone: "", email: "", terms: "" });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const types = ["DMC", "Hotel Chain", "Local Operator", "Freelance Guide", "Transport"];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-xl shadow-xl border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-card)] rounded-t-xl flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-[var(--ink)]">Add supplier</div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Supplier / company name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Coastal Karnataka DMC" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]">
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {[
            { k: "contact", label: "Contact person", ph: "e.g. Rajesh Kumar" },
            { k: "phone", label: "Phone", ph: "+91 …" },
            { k: "email", label: "Email", ph: "ops@company.com" },
            { k: "terms", label: "Payment terms", ph: "e.g. 50% advance, balance on arrival" },
          ].map(f => (
            <div key={f.k}>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">{f.label}</label>
              <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
          ))}
          <button
            onClick={() => { if (form.name) onCreate(form); }}
            className="w-full text-[13px] font-medium py-2 rounded flex items-center justify-center gap-1.5"
            style={{ background: "var(--brass)", color: "white" }}
          >
            <Plus size={14} /> Add supplier
          </button>
        </div>
      </div>
    </div>
  );
}

function NewHotelModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", destination: "", category: "Mid", roomTypes: "", negotiatedRate: "", rackRate: "", contact: "", cancellation: "" });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const categories = ["Budget", "Mid", "Luxury"];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-xl shadow-xl border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-card)] rounded-t-xl flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-[var(--ink)]">New hotel</div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
          {[
            { k: "name", label: "Hotel / property name", ph: "e.g. Coconut Grove Resort" },
            { k: "destination", label: "Destination", ph: "e.g. Goa" },
          ].map(f => (
            <div key={f.k}>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">{f.label}</label>
              <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
          ))}
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Room types</label>
            <input value={form.roomTypes} onChange={e => set("roomTypes", e.target.value)} placeholder="e.g. Deluxe Room, Sea View Suite" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Negotiated rate (₹/night)</label>
              <input type="number" value={form.negotiatedRate} onChange={e => set("negotiatedRate", e.target.value)} placeholder="4200" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Rack rate (₹/night)</label>
              <input type="number" value={form.rackRate} onChange={e => set("rackRate", e.target.value)} placeholder="5800" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Contact for reservations</label>
            <input value={form.contact} onChange={e => set("contact", e.target.value)} placeholder="Name · phone / email" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Cancellation policy</label>
            <input value={form.cancellation} onChange={e => set("cancellation", e.target.value)} placeholder="e.g. Free cancellation up to 5 days prior" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <button
            onClick={() => { if (form.name && form.destination) onCreate(form); }}
            className="w-full text-[13px] font-medium py-2 rounded flex items-center justify-center gap-1.5"
            style={{ background: "var(--brass)", color: "white" }}
          >
            <Plus size={14} /> Add hotel
          </button>
        </div>
      </div>
    </div>
  );
}

function NewVehicleModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", type: "Sedan", capacity: "", perDayRate: "", perKmRate: "", status: "Available" });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const types = ["Sedan", "SUV", "Tempo Traveller", "Bus"];
  const statuses = ["Available", "On Trip", "Maintenance"];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-xl shadow-xl border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-card)] rounded-t-xl flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-[var(--ink)]">New vehicle</div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Vehicle / vendor name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Konkan Coachlines — Mini Bus" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]">
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Capacity (pax)</label>
              <input type="number" min={1} value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="6" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Per-day rate (₹)</label>
              <input type="number" value={form.perDayRate} onChange={e => set("perDayRate", e.target.value)} placeholder="3200" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Per-km rate (₹)</label>
              <input type="number" value={form.perKmRate} onChange={e => set("perKmRate", e.target.value)} placeholder="14" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Availability</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => { if (form.name) onCreate(form); }}
            className="w-full text-[13px] font-medium py-2 rounded flex items-center justify-center gap-1.5"
            style={{ background: "var(--brass)", color: "white" }}
          >
            <Plus size={14} /> Add vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

function NewQuotationModal({ onClose, onCreate, leads }) {
  const [leadId, setLeadId] = useState(leads[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const selectedLead = leads.find(l => l.id === leadId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-xl shadow-xl border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-card)] rounded-t-xl flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-[var(--ink)]">New quotation</div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Lead</label>
            <select value={leadId} onChange={e => setLeadId(e.target.value)} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]">
              {leads.length === 0 && <option value="">No leads yet</option>}
              {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.destination}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 98000" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Valid until</label>
            <input value={validUntil} onChange={e => setValidUntil(e.target.value)} placeholder="e.g. 30 Aug 2026" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <button
            onClick={() => { if (selectedLead && amount && validUntil) onCreate({ lead: selectedLead, amount: Number(amount), validUntil }); }}
            className="w-full text-[13px] font-medium py-2 rounded flex items-center justify-center gap-1.5"
            style={{ background: "var(--brass)", color: "white" }}
          >
            <Plus size={14} /> Create & send quotation
          </button>
        </div>
      </div>
    </div>
  );
}

function NewInvoiceModal({ onClose, onCreate, bookings }) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [dueDate, setDueDate] = useState("");
  const selectedBooking = bookings.find(b => b.id === bookingId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-xl shadow-xl border border-[var(--line)]">
        <div className="p-4 border-b border-[var(--line)] bg-[var(--paper-card)] rounded-t-xl flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-[var(--ink)]">New invoice</div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Booking</label>
            <select value={bookingId} onChange={e => { setBookingId(e.target.value); const b = bookings.find(bk => bk.id === e.target.value); if (b) { setAmount(b.amount); setPaid(b.paid); } }} className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]">
              {bookings.length === 0 && <option value="">No bookings yet</option>}
              {bookings.map(b => <option key={b.id} value={b.id}>{b.name} — {b.destination}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Amount (₹)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 110000" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Paid so far (₹)</label>
              <input type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="e.g. 40000" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Due date</label>
            <input value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="e.g. 5 Sep 2026" className="w-full mt-1 text-[13px] p-2 rounded border border-[var(--line)] bg-[var(--paper-card)]" />
          </div>
          <button
            onClick={() => { if (selectedBooking && amount && dueDate) onCreate({ booking: selectedBooking, amount: Number(amount), paid: Number(paid) || 0, dueDate }); }}
            className="w-full text-[13px] font-medium py-2 rounded flex items-center justify-center gap-1.5"
            style={{ background: "var(--brass)", color: "white" }}
          >
            <Plus size={14} /> Create invoice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   VIEWS
----------------------------------------------------------------*/
function Dashboard({ leads, bookings, followups, suppliers, invoices, activity, onNewInquiry, onNewSupplier, onNewQuotation, onNewInvoice }) {
  const activeLeads = leads.filter(l => !l.lost && l.stage !== "Completed & Reviewed").length;
  const revenue = bookings.reduce((s, b) => s + b.paid, 0);
  const grossProfit = leads.filter(l => l.stage === "Booking Confirmed" || l.stage === "Completed & Reviewed").reduce((s, l) => s + (l.sellingPrice - l.cost), 0);
  const dueToday = followups.filter(f => f.due === "Today" && !f.done).length;
  const supplierDues = suppliers.reduce((s, sup) => s + sup.pendingDue, 0);
  const clientDues = invoices.reduce((s, inv) => s + (inv.amount - inv.paid), 0);
  const todaysPayments = activity.filter(a => a.ts.startsWith("Today") && a.text.startsWith("Payment received"));
  const todaysRevenue = todaysPayments.reduce((s, a) => {
    const m = a.text.match(/₹([\d,]+)/);
    return s + (m ? Number(m[1].replace(/,/g, "")) : 0);
  }, 0);
  const todaysGrossProfit = Math.round(todaysRevenue * 0.28);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-[var(--ink)]">Good afternoon, Sameer</h1>
          <p className="text-[13px] text-[var(--text-mute)] mt-1">Here's where things stand today — logged by hand, nothing sent automatically.</p>
        </div>
        <QuickActions onNewInquiry={onNewInquiry} onNewSupplier={onNewSupplier} onNewQuotation={onNewQuotation} onNewInvoice={onNewInvoice} />
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard icon={Users} label="Active Leads" value={activeLeads} hint={`${leads.length} total this month`} />
        <StatCard icon={Briefcase} label="Confirmed Bookings" value={bookings.length} hint="upcoming departures" />
        <StatCard icon={IndianRupee} label="Collected" value={money(revenue)} hint="across active bookings" />
        <StatCard icon={IndianRupee} label="Gross Profit" value={money(grossProfit)} hint="confirmed + completed trips" />
        <StatCard icon={Truck} label="Pending Supplier Dues" value={money(supplierDues)} hint={`${suppliers.filter(s=>s.pendingDue>0).length} suppliers owed`} />
        <StatCard icon={Bell} label="Follow-ups Due Today" value={dueToday} hint="mark done as you go" />
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--ink)] mb-3">Finance snapshot</h2>
        <div className="flex flex-wrap gap-3">
          <StatCard icon={Receipt} label="Pending Client Dues" value={money(clientDues)} hint={`${invoices.filter(i => i.amount - i.paid > 0).length} invoices with balance`} />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={money(todaysRevenue)} hint="payments logged today" />
          <StatCard icon={IndianRupee} label="Today's Gross Profit" value={money(todaysGrossProfit)} hint="est. margin on today's collections" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <h2 className="font-display text-[16px] font-semibold text-[var(--ink)] mb-3">Upcoming departures</h2>
          <div className="space-y-3">
            {bookings.map(b => (
              <TicketCard key={b.id} title={b.name} sub={`${b.pax} traveller${b.pax > 1 ? "s" : ""}`} destination={b.destination}
                meta={[`Departs ${b.depart}`, `Returns ${b.ret}`]} stamp={b.status} stampColor={b.status === "Fully Paid" ? "var(--teal)" : "var(--stamp)"} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-[16px] font-semibold text-[var(--ink)] mb-3 flex items-center gap-1.5"><Clock size={14} /> Activity feed</h2>
          <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] divide-y divide-[var(--line)] max-h-[360px] overflow-y-auto">
            {activity.map(a => (
              <div key={a.id} className="p-3">
                <div className="text-[12px] text-[var(--text)]">{a.text}</div>
                <div className="text-[10.5px] font-mono text-[var(--text-mute)] mt-1">{a.ts}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-[16px] font-semibold text-[var(--ink)] mb-3">Needs a follow-up</h2>
        <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] divide-y divide-[var(--line)]">
          {followups.filter(f => !f.done).slice(0, 5).map(f => {
            const Icon = channelIcon[f.channel];
            return (
              <div key={f.id} className="p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--paper)" }}>
                  <Icon size={14} style={{ color: channelColor[f.channel] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ink)] truncate">{f.name}</div>
                  <div className="text-[12px] text-[var(--text-mute)] truncate">{f.task}</div>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-mute)] shrink-0">{f.due}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function waTemplateFor(lead) {
  const base = `Hi ${lead.name}, thanks for your interest in ${lead.destination}!`;
  if (lead.stage === "Quotation Sent") return `${base} Just checking in — did you get a chance to look over the quote we sent?`;
  if (lead.stage === "Booking Confirmed") return `${base} Your trip is confirmed — we'll share the final itinerary and travel documents shortly.`;
  if (lead.stage === "Contacted") return `${base} Following up on our chat — let us know if you'd like us to put together a quote.`;
  return `${base} We'll be in touch shortly with a quote.`;
}

function LeadDrawer({ lead, onClose, onAddNote, onMoveStage, onMarkLost, onSendWhatsApp }) {
  const [channel, setChannel] = useState("Call");
  const [note, setNote] = useState("");
  const [waPhone, setWaPhone] = useState(lead?.phone || "");
  const [waMessage, setWaMessage] = useState(lead ? waTemplateFor(lead) : "");
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState(null);
  if (!lead) return null;
  const idx = STAGES.indexOf(lead.stage);
  const profit = lead.sellingPrice - lead.cost;

  const handleSendWhatsApp = async () => {
    if (!waPhone.trim() || !waMessage.trim()) return;
    setWaSending(true);
    setWaResult(null);
    const result = await onSendWhatsApp(lead, waPhone.trim(), waMessage.trim());
    setWaResult(result);
    setWaSending(false);
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-[var(--ink)]/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] h-full shadow-xl overflow-y-auto">
        <div className="p-5 border-b border-[var(--line)] bg-[var(--paper-card)] flex items-start justify-between">
          <div>
            <div className="font-display text-[19px] font-semibold text-[var(--ink)]">{lead.name}</div>
            <div className="text-[12px] text-[var(--text-mute)] mt-0.5 flex items-center gap-1"><MapPin size={11} /> {lead.destination} · {lead.travelWindow}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-mute)] hover:text-[var(--ink)]"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] py-2">
              <div className="text-[11px] text-[var(--text-mute)]">Selling price</div>
              <div className="font-display font-semibold text-[var(--ink)] text-[13px]">{money(lead.sellingPrice)}</div>
            </div>
            <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] py-2">
              <div className="text-[11px] text-[var(--text-mute)]">Cost</div>
              <div className="font-display font-semibold text-[var(--ink)] text-[13px]">{money(lead.cost)}</div>
            </div>
            <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] py-2">
              <div className="text-[11px] text-[var(--text-mute)]">Profit</div>
              <div className="font-display font-semibold text-[13px]" style={{ color: "var(--teal)" }}>{money(profit)}</div>
            </div>
          </div>

          <div className="text-[12px] text-[var(--text-mute)]">Referred by: <span className="text-[var(--ink)] font-medium">{lead.referredBy || "—"}</span></div>

          <div className="bg-[var(--paper-card)] border border-[var(--line)] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">
              <MessageCircle size={12} /> Send WhatsApp
            </div>
            <input
              value={waPhone}
              onChange={e => setWaPhone(e.target.value)}
              placeholder="Phone number, e.g. +91 98xxxxxx21"
              className="w-full text-[12.5px] p-2 rounded border border-[var(--line)] bg-[var(--paper)]"
            />
            <textarea
              value={waMessage}
              onChange={e => setWaMessage(e.target.value)}
              rows={3}
              className="w-full text-[12.5px] p-2 rounded border border-[var(--line)] bg-[var(--paper)] resize-none"
            />
            <button
              onClick={handleSendWhatsApp}
              disabled={waSending || !waPhone.trim() || !waMessage.trim()}
              className="w-full text-[12px] font-medium py-1.5 rounded flex items-center justify-center gap-1 disabled:opacity-50"
              style={{ background: "var(--teal)", color: "white" }}
            >
              <Send size={13} /> {waSending ? "Sending…" : "Send via WhatsApp"}
            </button>
            {waResult && (
              <div className="text-[11px] flex items-start gap-1.5">
                {waResult.status === "sent" && <StampBadge text="Sent" color="var(--teal)" />}
                {waResult.status === "simulated" && <StampBadge text="Simulated — not connected" color="var(--brass-dark)" />}
                {waResult.status === "failed" && <StampBadge text="Failed" color="var(--stamp)" />}
                {waResult.status === "offline" && <StampBadge text="Offline — not saved" color="var(--stamp)" />}
                {waResult.note && <span className="text-[var(--text-mute)] flex-1">{waResult.note}</span>}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium">Pipeline stage</div>
              {!lead.lost && <span className="text-[10.5px] font-mono text-[var(--text-mute)]">Step {idx + 1} of {STAGES.length}</span>}
            </div>
            {lead.lost ? (
              <div className="text-center py-1.5 rounded font-medium text-[13px]" style={{ background: "var(--stamp-soft)", color: "var(--stamp)" }}>Cancelled / Lost</div>
            ) : (
              <div className="flex items-center gap-1">
                <button disabled={idx === 0} onClick={() => onMoveStage(lead.id, -1)} className="p-1.5 rounded border border-[var(--line)] disabled:opacity-30 bg-[var(--paper-card)]"><ChevronLeft size={14} /></button>
                <div className="flex-1 text-center font-medium text-[13px] py-1.5 rounded" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>{lead.stage}</div>
                <button disabled={idx === STAGES.length - 1} onClick={() => onMoveStage(lead.id, 1)} className="p-1.5 rounded border border-[var(--line)] disabled:opacity-30 bg-[var(--paper-card)]"><ChevronRight size={14} /></button>
              </div>
            )}
            {!lead.lost && (
              <button onClick={() => onMarkLost(lead.id)} className="mt-2 text-[11px] text-[var(--stamp)] underline">Mark as lost / cancelled</button>
            )}
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium mb-2">Manual contact log</div>
            <p className="text-[11px] text-[var(--text-mute)] mb-3">You log every call, WhatsApp chat, or email yourself — nothing here sends or reads messages automatically.</p>
            <div className="space-y-2 mb-4">
              {lead.log.length === 0 && <div className="text-[12px] text-[var(--text-mute)] italic">No contact logged yet.</div>}
              {lead.log.map(entry => {
                const Icon = channelIcon[entry.channel];
                return (
                  <div key={entry.id} className="flex gap-2 bg-[var(--paper-card)] border border-[var(--line)] rounded-lg p-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0" style={{ color: channelColor[entry.channel] }} />
                    <div className="flex-1">
                      <div className="text-[12.5px] text-[var(--text)]">{entry.note}</div>
                      <div className="text-[10.5px] font-mono text-[var(--text-mute)] mt-1">{entry.channel} · {entry.ts}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-[var(--paper-card)] border border-[var(--line)] rounded-lg p-3 space-y-2">
              <div className="flex gap-1.5">
                {Object.keys(channelIcon).map(c => (
                  <button key={c} onClick={() => setChannel(c)} className="px-2.5 py-1 rounded text-[11px] font-medium border"
                    style={channel === c ? { background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)" } : { borderColor: "var(--line)", color: "var(--text-mute)" }}>
                    {c}
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What did you discuss or send?" className="w-full text-[12.5px] p-2 rounded border border-[var(--line)] bg-[var(--paper)] resize-none" rows={2} />
              <button onClick={() => { if (note.trim()) { onAddNote(lead.id, channel, note); setNote(""); } }} className="w-full text-[12px] font-medium py-1.5 rounded flex items-center justify-center gap-1" style={{ background: "var(--brass)", color: "white" }}>
                <Plus size={13} /> Log this contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SyncFromSheet({ onSync }) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    if (!sheetUrl.trim()) return;
    setSyncing(true);
    setResult(null);
    const res = await onSync(sheetUrl.trim());
    setResult(res);
    setSyncing(false);
  };

  return (
    <div className="ticket bg-[var(--paper-card)] rounded-lg shadow-sm border border-[var(--line)] p-4 mb-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--text-mute)] font-medium mb-2">
        <RefreshCw size={12} /> Sync leads from Google Sheet
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={sheetUrl}
          onChange={e => setSheetUrl(e.target.value)}
          placeholder="Google Sheet CSV export link (File → Share → Publish to web → CSV)"
          className="flex-1 min-w-[240px] text-[12.5px] p-2 rounded border border-[var(--line)] bg-[var(--paper)]"
        />
        <button
          onClick={handleSync}
          disabled={syncing || !sheetUrl.trim()}
          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded disabled:opacity-50"
          style={{ background: "var(--brass)", color: "white" }}
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
      {result && (
        <div className="text-[11.5px] text-[var(--text-mute)] mt-2">
          {result.error
            ? <span style={{ color: "var(--stamp)" }}>{result.error}</span>
            : <>Imported <span className="font-medium text-[var(--ink)]">{result.imported?.length ?? 0}</span> new lead{(result.imported?.length ?? 0) === 1 ? "" : "s"}, skipped {result.skipped ?? 0} duplicate{(result.skipped ?? 0) === 1 ? "" : "s"}.
              {result.recognizedColumns?.length > 0 && <div className="mt-1 font-mono text-[10.5px]">Recognized columns: {result.recognizedColumns.join(", ")}</div>}
            </>}
        </div>
      )}
    </div>
  );
}

function LeadsBoard({ leads, onOpen, onSync }) {
  const lost = leads.filter(l => l.lost);
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-[var(--ink)]">Leads pipeline</h1>
          <p className="text-[13px] text-[var(--text-mute)] mt-0.5">Open a card to log contact, move it forward, or see its numbers.</p>
        </div>
      </div>
      <SyncFromSheet onSync={onSync} />
      <div className="flex gap-4 overflow-x-auto pb-3">
        {STAGES.map((stage, si) => (
          <div key={stage} className="min-w-[250px] flex-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-[var(--text-mute)]">{stage}</span>
              <span className="text-[11px] font-mono text-[var(--text-mute)]">{leads.filter(l => l.stage === stage && !l.lost).length}</span>
            </div>
            <div className="space-y-3">
              {leads.filter(l => l.stage === stage && !l.lost).map(l => (
                <TicketCard key={l.id} title={l.name} sub={`${l.pax} pax · ${money(l.sellingPrice)}`} destination={l.destination}
                  meta={[`Step ${si + 1} of ${STAGES.length}`, l.travelWindow]} onClick={() => onOpen(l)}>
                  {l.log.length > 0 ? `Last: ${l.log[l.log.length - 1].channel} — ${l.log[l.log.length - 1].ts}` : "No contact logged yet"}
                </TicketCard>
              ))}
              {leads.filter(l => l.stage === stage && !l.lost).length === 0 && <div className="text-[11px] text-[var(--text-mute)] italic px-1">Empty</div>}
            </div>
          </div>
        ))}
        <div className="min-w-[250px] flex-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--stamp)" }}>Cancelled / Lost</span>
            <span className="text-[11px] font-mono text-[var(--text-mute)]">{lost.length}</span>
          </div>
          <div className="space-y-3">
            {lost.map(l => (
              <TicketCard key={l.id} title={l.name} sub={`${l.pax} pax · ${money(l.sellingPrice)}`} destination={l.destination}
                meta={[l.travelWindow]} stamp="Lost" stampColor="var(--stamp)" onClick={() => onOpen(l)} />
            ))}
            {lost.length === 0 && <div className="text-[11px] text-[var(--text-mute)] italic px-1">None — good sign</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bookings({ bookings }) {
  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-[var(--ink)] mb-1">Bookings</h1>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Confirmed trips, at a glance.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {bookings.map(b => {
          const pct = Math.round((b.paid / b.amount) * 100);
          return (
            <TicketCard key={b.id} title={b.name} sub={`${b.pax} traveller${b.pax > 1 ? "s" : ""}`} destination={b.destination}
              meta={[`Depart ${b.depart}`, `Return ${b.ret}`]} stamp={b.status} stampColor={b.status === "Fully Paid" ? "var(--teal)" : "var(--stamp)"}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--text-mute)]">{money(b.paid)} of {money(b.amount)}</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brass)" }} />
              </div>
            </TicketCard>
          );
        })}
      </div>
    </div>
  );
}

function Suppliers({ suppliers }) {
  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-[var(--ink)] mb-1">Suppliers</h1>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Who you buy from — DMCs, hotels, local operators, transport — and what you owe them.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-[16px] font-semibold text-[var(--ink)]">{s.name}</div>
                <div className="text-[11px] text-[var(--text-mute)] mt-0.5">{s.contact} · {s.phone}</div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--line)", color: "var(--text-mute)" }}>{s.type}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--line)]">
              <div>
                <div className="text-[10.5px] text-[var(--text-mute)] uppercase tracking-wide">Pending due</div>
                <div className="font-display text-[17px] font-semibold" style={{ color: s.pendingDue > 0 ? "var(--stamp)" : "var(--teal)" }}>
                  {s.pendingDue > 0 ? money(s.pendingDue) : "Settled"}
                </div>
                {s.pendingDue > 0 && <div className="text-[10.5px] text-[var(--text-mute)] font-mono">due {s.dueDate}</div>}
              </div>
              <Stars n={s.rating} />
            </div>
            <div className="mt-3 text-[11px] text-[var(--text-mute)]">
              <span className="font-medium text-[var(--ink)]">Terms:</span> {s.terms}
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-mute)]">
              <span className="font-medium text-[var(--ink)]">Linked:</span> {s.linkedBookings.join(", ")}
            </div>
            {s.notes && <div className="mt-2 text-[11px] text-[var(--text-mute)] italic">"{s.notes}"</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const categoryColor = { Budget: "var(--teal)", Mid: "var(--brass-dark)", Luxury: "var(--stamp)" };

function Hotels({ hotels, onNewHotel }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className="font-display text-[24px] font-semibold text-[var(--ink)]">Hotels</h1>
        <button onClick={onNewHotel} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--ink)", color: "white" }}>
          <Plus size={13} /> New Hotel
        </button>
      </div>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Your curated stays — negotiated rates, room types, and cancellation terms in one place.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {hotels.map(h => {
          const savings = h.rackRate > 0 ? Math.round(((h.rackRate - h.negotiatedRate) / h.rackRate) * 100) : 0;
          return (
            <div key={h.id} className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-[16px] font-semibold text-[var(--ink)]">{h.name}</div>
                  <div className="text-[11px] text-[var(--text-mute)] mt-0.5 flex items-center gap-1"><MapPin size={11} /> {h.destination}</div>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border" style={{ borderColor: categoryColor[h.category], color: categoryColor[h.category] }}>{h.category}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--line)]">
                <div>
                  <div className="text-[10.5px] text-[var(--text-mute)] uppercase tracking-wide">Negotiated / night</div>
                  <div className="font-display text-[17px] font-semibold" style={{ color: "var(--teal)" }}>{money(h.negotiatedRate)}</div>
                  <div className="text-[10.5px] text-[var(--text-mute)] font-mono line-through">{money(h.rackRate)} rack</div>
                </div>
                {savings > 0 && (
                  <span className="text-[10.5px] font-mono px-2 py-1 rounded-full" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>~{savings}% saved</span>
                )}
              </div>
              <div className="mt-3 text-[11px] text-[var(--text-mute)]">
                <span className="font-medium text-[var(--ink)]">Room types:</span> {h.roomTypes}
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-mute)]">
                <span className="font-medium text-[var(--ink)]">Reservations:</span> {h.contact}
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-mute)] italic">{h.cancellation}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const fleetStatusColor = { Available: "var(--teal)", "On Trip": "var(--brass-dark)", Maintenance: "var(--stamp)" };

function Fleet({ fleet, onNewVehicle }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className="font-display text-[24px] font-semibold text-[var(--ink)]">Transport fleet</h1>
        <button onClick={onNewVehicle} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--ink)", color: "white" }}>
          <Plus size={13} /> New Vehicle
        </button>
      </div>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Vehicles and transport vendors you rely on — rates and current availability.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {fleet.map(v => (
          <div key={v.id} className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-[16px] font-semibold text-[var(--ink)]">{v.name}</div>
                <div className="text-[11px] text-[var(--text-mute)] mt-0.5">{v.type} · {v.capacity} pax</div>
              </div>
              <StampBadge text={v.status} color={fleetStatusColor[v.status]} />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--line)]">
              <div>
                <div className="text-[10.5px] text-[var(--text-mute)] uppercase tracking-wide">Per day</div>
                <div className="font-display text-[15px] font-semibold text-[var(--ink)]">{money(v.perDayRate)}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-[var(--text-mute)] uppercase tracking-wide">Per km</div>
                <div className="font-display text-[15px] font-semibold text-[var(--ink)]">{money(v.perKmRate)}</div>
              </div>
            </div>
            {v.status === "On Trip" && v.bookingDates && (
              <div className="mt-3 text-[11px] text-[var(--text-mute)]">
                <span className="font-medium text-[var(--ink)]">Booked:</span> {v.bookingDates}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const quoteStatusColor = { Draft: "var(--text-mute)", Sent: "var(--brass-dark)", Accepted: "var(--teal)", Expired: "var(--stamp)" };

function Quotations({ quotations, onNewQuotation }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className="font-display text-[24px] font-semibold text-[var(--ink)]">Quotations</h1>
        <button onClick={onNewQuotation} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--ink)", color: "white" }}>
          <Plus size={13} /> New Quotation
        </button>
      </div>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Every quote you've sent, tracked from draft to acceptance.</p>
      <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-mute)] border-b border-[var(--line)]">
              <th className="p-3 font-medium">Quote ID</th><th className="p-3 font-medium">Lead</th><th className="p-3 font-medium">Destination</th>
              <th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Valid until</th><th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id} className="border-b border-[var(--line)] last:border-0">
                <td className="p-3 font-mono text-[var(--ink)]">{q.id}</td>
                <td className="p-3 font-medium text-[var(--ink)]">{q.leadName}</td>
                <td className="p-3 text-[var(--text-mute)]">{q.destination}</td>
                <td className="p-3 font-mono">{money(q.amount)}</td>
                <td className="p-3 text-[var(--text-mute)] font-mono">{q.created}</td>
                <td className="p-3 text-[var(--text-mute)] font-mono">{q.validUntil}</td>
                <td className="p-3"><StampBadge text={q.status} color={quoteStatusColor[q.status]} /></td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-[var(--text-mute)] italic">No quotations yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const invoiceStatusColor = { Issued: "var(--brass-dark)", Partial: "var(--stamp)", Paid: "var(--teal)", Overdue: "var(--stamp)" };

function Invoices({ invoices, onNewInvoice }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className="font-display text-[24px] font-semibold text-[var(--ink)]">Invoices</h1>
        <button onClick={onNewInvoice} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: "var(--ink)", color: "white" }}>
          <Plus size={13} /> New Invoice
        </button>
      </div>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Billing against confirmed bookings and what's still outstanding.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {invoices.map(inv => {
          const balance = inv.amount - inv.paid;
          const pct = inv.amount > 0 ? Math.round((inv.paid / inv.amount) * 100) : 0;
          return (
            <TicketCard key={inv.id} title={inv.id} sub={inv.bookingName} destination={inv.destination}
              meta={[`Due ${inv.dueDate}`, `${money(inv.paid)} of ${money(inv.amount)}`]} stamp={inv.status} stampColor={invoiceStatusColor[inv.status]}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--text-mute)]">{balance > 0 ? `${money(balance)} outstanding` : "Fully settled"}</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brass)" }} />
              </div>
            </TicketCard>
          );
        })}
        {invoices.length === 0 && <div className="text-[13px] text-[var(--text-mute)] italic">No invoices yet</div>}
      </div>
    </div>
  );
}

function Clients({ clients }) {
  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-[var(--ink)] mb-1">Clients</h1>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Everyone who's travelled with you.</p>
      <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-mute)] border-b border-[var(--line)]">
              <th className="p-3 font-medium">Client</th><th className="p-3 font-medium">Trips</th><th className="p-3 font-medium">Lifetime value</th><th className="p-3 font-medium">Most recent</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                <td className="p-3 font-medium text-[var(--ink)]">{c.name}</td>
                <td className="p-3 font-mono">{c.trips}</td>
                <td className="p-3 font-mono">{c.ltv > 0 ? money(c.ltv) : "—"}</td>
                <td className="p-3 text-[var(--text-mute)]">{c.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Followups({ followups, onToggle }) {
  const groups = ["Today", "Tomorrow", "18 Aug", "12 Nov"];
  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-[var(--ink)] mb-1">Follow-ups</h1>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Reminders you set for yourself — you make every call, chat, or email; nothing sends on its own.</p>
      <div className="space-y-5">
        {groups.map(g => {
          const items = followups.filter(f => f.due === g);
          if (items.length === 0) return null;
          return (
            <div key={g}>
              <div className="text-[11px] uppercase tracking-wide font-semibold text-[var(--text-mute)] mb-2">{g}</div>
              <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] divide-y divide-[var(--line)]">
                {items.map(f => {
                  const Icon = channelIcon[f.channel];
                  return (
                    <div key={f.id} className="p-3 flex items-center gap-3">
                      <button onClick={() => onToggle(f.id)} className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                        style={f.done ? { background: "var(--teal)", borderColor: "var(--teal)" } : { borderColor: "var(--line)" }}>
                        {f.done && <Check size={12} color="white" />}
                      </button>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--paper)" }}>
                        <Icon size={14} style={{ color: channelColor[f.channel] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] font-medium text-[var(--ink)] ${f.done ? "line-through opacity-50" : ""}`}>{f.name}</div>
                        <div className={`text-[12px] text-[var(--text-mute)] ${f.done ? "line-through opacity-50" : ""}`}>{f.task}</div>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-mute)] shrink-0">{f.channel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const waStatusColor = { sent: "var(--teal)", simulated: "var(--brass-dark)", failed: "var(--stamp)", offline: "var(--stamp)" };
const waStatusLabel = { sent: "Sent", simulated: "Simulated — not connected", failed: "Failed", offline: "Offline" };

function WhatsAppOutbox({ outbox, configured }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className="font-display text-[24px] font-semibold text-[var(--ink)]">WhatsApp</h1>
        <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--line)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: configured ? "var(--teal)" : "var(--brass)" }} />
          {configured ? "Business API connected" : "Not connected — sends are simulated"}
        </div>
      </div>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">Every message attempted from a lead's card, whether actually sent or simulated because credentials aren't set up yet.</p>
      <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-mute)] border-b border-[var(--line)]">
              <th className="p-3 font-medium">Phone</th><th className="p-3 font-medium">Message</th>
              <th className="p-3 font-medium">Status</th><th className="p-3 font-medium">When</th><th className="p-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {outbox.map(w => (
              <tr key={w.id} className="border-b border-[var(--line)] last:border-0">
                <td className="p-3 font-mono text-[var(--ink)]">{w.phone}</td>
                <td className="p-3 text-[var(--text-mute)] max-w-[260px] truncate">{w.message}</td>
                <td className="p-3"><StampBadge text={waStatusLabel[w.status] || w.status} color={waStatusColor[w.status] || "var(--text-mute)"} /></td>
                <td className="p-3 text-[var(--text-mute)] font-mono">{w.ts}</td>
                <td className="p-3 text-[var(--text-mute)] max-w-[220px] truncate">{w.note}</td>
              </tr>
            ))}
            {outbox.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-[var(--text-mute)] italic">No WhatsApp messages sent yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsView({ configured }) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-[24px] font-semibold text-[var(--ink)] mb-1">Settings</h1>
      <p className="text-[13px] text-[var(--text-mute)] mb-5">How this CRM's data storage and integrations work, in plain language.</p>

      <div className="space-y-4">
        <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4">
          <div className="font-display text-[15px] font-semibold text-[var(--ink)] mb-1">Data storage</div>
          <p className="text-[13px] text-[var(--text)] leading-relaxed">
            This CRM stores leads, quotations, invoices, and activity using Netlify's built-in storage
            (Netlify Blobs), which comes with your Netlify account — no separate database or extra
            account needed. It's a good fit for a single-person or small-team CRM like this one.
          </p>
        </div>

        <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="font-display text-[15px] font-semibold text-[var(--ink)]">WhatsApp sending</div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full" style={{ background: configured ? "var(--teal)" : "var(--brass)" }} />
              {configured ? "Connected" : "Not connected yet"}
            </div>
          </div>
          <p className="text-[13px] text-[var(--text)] leading-relaxed">
            To send real WhatsApp messages, you need a Meta WhatsApp Business API account (set up
            directly with Meta or through a provider). Once you have it, add two values —
            <span className="font-mono text-[12px]"> WHATSAPP_TOKEN</span> and
            <span className="font-mono text-[12px]"> WHATSAPP_PHONE_NUMBER_ID</span> — as Environment
            variables under <span className="font-medium">Site settings → Environment variables</span> in
            your Netlify dashboard. Until then, "Send via WhatsApp" clearly marks messages as
            <span className="font-medium"> simulated</span> instead of pretending they went out.
          </p>
          <p className="text-[11px] text-[var(--text-mute)] mt-2 italic">
            For security, this app never asks you to paste those credentials into a form here — they're
            set only in Netlify's own environment variable settings, never exposed to the browser.
          </p>
        </div>

        <div className="bg-[var(--paper-card)] rounded-lg border border-[var(--line)] p-4">
          <div className="font-display text-[15px] font-semibold text-[var(--ink)] mb-1">Syncing leads from a Google Sheet</div>
          <ol className="text-[13px] text-[var(--text)] leading-relaxed list-decimal list-inside space-y-1">
            <li>In your Google Sheet, go to <span className="font-medium">File → Share → Publish to web</span>.</li>
            <li>Choose the sheet/tab with your inquiries and select <span className="font-medium">CSV</span> as the format, then publish.</li>
            <li>Copy the link it gives you.</li>
            <li>Paste that link into the <span className="font-medium">Sync leads from Google Sheet</span> box on the Leads page and click <span className="font-medium">Sync now</span>.</li>
          </ol>
          <p className="text-[13px] text-[var(--text-mute)] mt-2">Re-running the sync is safe — leads already imported (matched by phone number, or by name + destination) won't be duplicated.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   APP
----------------------------------------------------------------*/
export default function TravelCRM() {
  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState(initialLeads);
  const [bookings] = useState(initialBookings);
  const [clients] = useState(initialClients);
  const [followups, setFollowups] = useState(initialFollowups);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [hotels, setHotels] = useState(initialHotels);
  const [fleet, setFleet] = useState(initialFleet);
  const [quotations, setQuotations] = useState(initialQuotations);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [activity, setActivity] = useState(initialActivity);
  const [whatsappOutbox, setWhatsappOutbox] = useState([]);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [openLead, setOpenLead] = useState(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [showHotel, setShowHotel] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [search, setSearch] = useState("");

  // On mount, pull real data from Netlify Functions/Blobs. If the functions
  // aren't reachable (e.g. plain `vite dev` without `netlify dev`), quietly
  // fall back to the in-memory mock data so local dev keeps working.
  useEffect(() => {
    (async () => {
      const [remoteLeads, remoteActivity, remoteQuotations, remoteInvoices, remoteOutbox, remoteStatus] = await Promise.all([
        apiGet("/.netlify/functions/leads", null),
        apiGet("/.netlify/functions/activity", null),
        apiGet("/.netlify/functions/quotations", null),
        apiGet("/.netlify/functions/invoices", null),
        apiGet("/.netlify/functions/whatsapp-outbox", []),
        apiGet("/.netlify/functions/whatsapp-status", { configured: false }),
      ]);
      if (remoteLeads && remoteLeads.length > 0) setLeads(remoteLeads);
      if (remoteActivity && remoteActivity.length > 0) setActivity(remoteActivity);
      if (remoteQuotations && remoteQuotations.length > 0) setQuotations(remoteQuotations);
      if (remoteInvoices && remoteInvoices.length > 0) setInvoices(remoteInvoices);
      setWhatsappOutbox(remoteOutbox || []);
      setWhatsappConfigured(!!(remoteStatus && remoteStatus.configured));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushActivity = (text) => {
    const entry = { id: "A" + Date.now(), text, ts: now() };
    setActivity(prev => [entry, ...prev]);
    apiPost("/.netlify/functions/activity", entry);
  };

  const addNote = (leadId, channel, note) => {
    const ts = now();
    const entry = { id: "n" + Date.now(), channel, note, ts };
    let updatedLead = null;
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      updatedLead = { ...l, log: [...l.log, entry] };
      return updatedLead;
    }));
    setOpenLead(prev => prev && prev.id === leadId ? { ...prev, log: [...prev.log, entry] } : prev);
    const lead = leads.find(l => l.id === leadId);
    if (lead) pushActivity(`${channel} logged with ${lead.name} — ${lead.destination}`);
    if (updatedLead) apiPost("/.netlify/functions/leads", updatedLead);
  };

  const moveStage = (leadId, dir) => {
    let newStage = null;
    let updatedLead = null;
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const idx = Math.min(Math.max(STAGES.indexOf(l.stage) + dir, 0), STAGES.length - 1);
      newStage = STAGES[idx];
      updatedLead = { ...l, stage: newStage };
      return updatedLead;
    }));
    setOpenLead(prev => {
      if (!prev || prev.id !== leadId) return prev;
      const idx = Math.min(Math.max(STAGES.indexOf(prev.stage) + dir, 0), STAGES.length - 1);
      return { ...prev, stage: STAGES[idx] };
    });
    const lead = leads.find(l => l.id === leadId);
    if (lead && newStage) pushActivity(`${lead.name} moved to "${newStage}" — ${lead.destination}`);
    if (updatedLead) apiPost("/.netlify/functions/leads", updatedLead);
  };

  const markLost = (leadId) => {
    let updatedLead = null;
    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      updatedLead = { ...l, lost: true };
      return updatedLead;
    }));
    setOpenLead(prev => prev && prev.id === leadId ? { ...prev, lost: true } : prev);
    const lead = leads.find(l => l.id === leadId);
    if (lead) pushActivity(`${lead.name} marked lost / cancelled — ${lead.destination}`);
    if (updatedLead) apiPost("/.netlify/functions/leads", updatedLead);
  };

  const syncFromSheet = async (sheetUrl) => {
    const result = await apiPost("/.netlify/functions/sync-sheet", { sheetUrl });
    if (!result) {
      return { error: "Couldn't reach the sync function — this only works once deployed on Netlify (or run with `netlify dev` locally)." };
    }
    if (result.error) return result;
    if (result.imported && result.imported.length > 0) {
      setLeads(prev => [...result.imported, ...prev]);
      setActivity(prev => [
        ...result.imported.map(l => ({ id: "A" + Date.now() + Math.random().toString(36).slice(2, 5), text: `New lead synced from Sheet — ${l.name}, ${l.destination}`, ts: now() })),
        ...prev,
      ]);
    }
    return result;
  };

  const sendWhatsApp = async (lead, phone, message) => {
    const result = await apiPost("/.netlify/functions/whatsapp-send", { leadId: lead.id, phone, message, leadName: lead.name });
    if (!result) {
      return { status: "offline", note: "Couldn't reach the WhatsApp function — this only works once deployed on Netlify (or run with `netlify dev` locally). Nothing was sent." };
    }
    setWhatsappOutbox(prev => [result, ...prev]);
    // whatsapp-send.js already appended a matching activity entry server-side
    // (blobs store) — just reflect it locally without posting again.
    const activityText = result.status === "sent" ? `WhatsApp sent to ${lead.name}`
      : result.status === "simulated" ? `WhatsApp simulated (not connected) for ${lead.name}`
      : `WhatsApp send failed for ${lead.name}`;
    setActivity(prev => [{ id: "A" + Date.now(), text: activityText, ts: now() }, ...prev]);
    return result;
  };

  const toggleFollowup = (id) => setFollowups(prev => prev.map(f => f.id === id ? { ...f, done: !f.done } : f));

  const createInquiry = (form) => {
    const id = "L" + Date.now();
    const newLead = {
      id, name: form.name, destination: form.destination, pax: Number(form.pax) || 1, phone: form.phone || "",
      sellingPrice: Number(form.budget) || 0, cost: 0, referredBy: form.referredBy || "Website Form",
      source: "Website", stage: "New Inquiry", lost: false, date: "Today", travelWindow: form.travelWindow || "TBD", log: [],
    };
    setLeads(prev => [newLead, ...prev]);
    pushActivity(`New inquiry — ${form.name}, ${form.destination}`);
    apiPost("/.netlify/functions/leads", newLead);
    setShowInquiry(false);
    setView("leads");
  };

  const createSupplier = (form) => {
    const id = "S" + Date.now();
    setSuppliers(prev => [{ id, name: form.name, type: form.type, contact: form.contact, phone: form.phone, email: form.email, terms: form.terms, pendingDue: 0, dueDate: "—", rating: 0, linkedBookings: [], notes: "" }, ...prev]);
    pushActivity(`Supplier added — ${form.name} (${form.type})`);
    setShowSupplier(false);
    setView("suppliers");
  };

  const createHotel = (form) => {
    const id = "H" + Date.now();
    setHotels(prev => [{
      id, name: form.name, destination: form.destination, category: form.category,
      roomTypes: form.roomTypes || "—", negotiatedRate: Number(form.negotiatedRate) || 0,
      rackRate: Number(form.rackRate) || 0, contact: form.contact || "—", cancellation: form.cancellation || "—",
    }, ...prev]);
    pushActivity(`Hotel added — ${form.name}, ${form.destination}`);
    setShowHotel(false);
    setView("hotels");
  };

  const createVehicle = (form) => {
    const id = "V" + Date.now();
    setFleet(prev => [{
      id, name: form.name, type: form.type, capacity: Number(form.capacity) || 1,
      perDayRate: Number(form.perDayRate) || 0, perKmRate: Number(form.perKmRate) || 0,
      status: form.status, bookingDates: "",
    }, ...prev]);
    pushActivity(`Vehicle added — ${form.name} (${form.type})`);
    setShowVehicle(false);
    setView("fleet");
  };

  const createQuotation = ({ lead, amount, validUntil }) => {
    const id = `QT-2026-${qtCounter++}`;
    const created = "Today";
    const newQuotation = { id, leadName: lead.name, destination: lead.destination, amount, status: "Sent", created, validUntil };
    setQuotations(prev => [newQuotation, ...prev]);
    pushActivity(`Quotation ${id} sent to ${lead.name} — ${lead.destination}`);
    apiPost("/.netlify/functions/quotations", newQuotation);
    const entry = { id: "n" + Date.now(), channel: "Email", note: `Quotation ${id} sent for ₹${amount.toLocaleString("en-IN")}, valid until ${validUntil}.`, ts: now() };
    let updatedLead = null;
    setLeads(prev => prev.map(l => {
      if (l.id !== lead.id) return l;
      updatedLead = { ...l, log: [...l.log, entry] };
      return updatedLead;
    }));
    setOpenLead(prev => prev && prev.id === lead.id ? { ...prev, log: [...prev.log, entry] } : prev);
    if (updatedLead) apiPost("/.netlify/functions/leads", updatedLead);
    setShowQuotation(false);
    setView("quotations");
  };

  const createInvoice = ({ booking, amount, paid, dueDate }) => {
    const id = `INV-2026-${invCounter++}`;
    const status = paid >= amount ? "Paid" : paid > 0 ? "Partial" : "Issued";
    const newInvoice = { id, bookingName: booking.name, destination: booking.destination, amount, paid, status, dueDate };
    setInvoices(prev => [newInvoice, ...prev]);
    pushActivity(`Invoice ${id} created for ${booking.name} — ${booking.destination}`);
    apiPost("/.netlify/functions/invoices", newInvoice);
    setShowInvoice(false);
    setView("invoices");
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "leads", label: "Leads", icon: Users },
    { id: "bookings", label: "Bookings", icon: Briefcase },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "hotels", label: "Hotels", icon: Building2 },
    { id: "fleet", label: "Fleet", icon: Car },
    { id: "quotations", label: "Quotations", icon: FileText },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "clients", label: "Clients", icon: MapPin },
    { id: "followups", label: "Follow-ups", icon: Bell },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="font-body min-h-screen flex" style={{ background: "var(--paper)", color: "var(--text)" }}>
      <style>{FONTS}</style>

      <aside className="w-56 shrink-0 hidden md:flex flex-col" style={{ background: "var(--ink)" }}>
        <div className="p-5 border-b border-white/10">
          <div className="font-display text-[19px] font-semibold text-white">Wanderline</div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--brass)] mt-0.5">Travel CRM · Trial</div>
        </div>
        <nav className="flex-1 py-3">
          {nav.map(n => {
            const Icon = n.icon; const active = view === n.id;
            return (
              <button key={n.id} onClick={() => setView(n.id)} className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-left"
                style={active ? { background: "rgba(184,134,59,0.15)", color: "var(--brass)", borderRight: "2px solid var(--brass)" } : { color: "rgba(255,255,255,0.65)" }}>
                <Icon size={15} />{n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-[10.5px] text-white/40 leading-relaxed">
          Contact logging is manual by design — connect WhatsApp Business API only once leads opt in.
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 px-5 md:px-8 py-4 border-b border-[var(--line)] bg-[var(--paper-card)]">
          <div className="font-display text-[15px] font-semibold text-[var(--ink)] md:hidden">Wanderline</div>
          <div className="hidden md:flex items-center gap-2 bg-[var(--paper)] border border-[var(--line)] rounded-full px-3 py-1.5 w-72">
            <Search size={13} style={{ color: "var(--text-mute)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads, clients, destinations…" className="bg-transparent outline-none text-[12.5px] flex-1" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10.5px] font-medium px-2.5 py-1 rounded-full" style={{ background: "var(--stamp-soft)", color: "var(--stamp)" }}>Day 4 of 14 — trial</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[13px] font-semibold" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>SM</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          {view === "dashboard" && <Dashboard leads={leads} bookings={bookings} followups={followups} suppliers={suppliers} invoices={invoices} activity={activity} onNewInquiry={() => setShowInquiry(true)} onNewSupplier={() => setShowSupplier(true)} onNewQuotation={() => setShowQuotation(true)} onNewInvoice={() => setShowInvoice(true)} />}
          {view === "leads" && <LeadsBoard leads={leads} onOpen={setOpenLead} onSync={syncFromSheet} />}
          {view === "bookings" && <Bookings bookings={bookings} />}
          {view === "suppliers" && <Suppliers suppliers={suppliers} />}
          {view === "hotels" && <Hotels hotels={hotels} onNewHotel={() => setShowHotel(true)} />}
          {view === "fleet" && <Fleet fleet={fleet} onNewVehicle={() => setShowVehicle(true)} />}
          {view === "quotations" && <Quotations quotations={quotations} onNewQuotation={() => setShowQuotation(true)} />}
          {view === "invoices" && <Invoices invoices={invoices} onNewInvoice={() => setShowInvoice(true)} />}
          {view === "clients" && <Clients clients={clients} />}
          {view === "followups" && <Followups followups={followups} onToggle={toggleFollowup} />}
          {view === "whatsapp" && <WhatsAppOutbox outbox={whatsappOutbox} configured={whatsappConfigured} />}
          {view === "settings" && <SettingsView configured={whatsappConfigured} />}
        </main>

        <nav className="md:hidden flex justify-around border-t border-[var(--line)] bg-[var(--paper-card)] py-2 overflow-x-auto">
          {nav.map(n => {
            const Icon = n.icon; const active = view === n.id;
            return (
              <button key={n.id} onClick={() => setView(n.id)} className="flex flex-col items-center gap-0.5 px-2 shrink-0">
                <Icon size={17} style={{ color: active ? "var(--brass)" : "var(--text-mute)" }} />
                <span className="text-[9.5px]" style={{ color: active ? "var(--brass)" : "var(--text-mute)" }}>{n.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {openLead && (
        <LeadDrawer key={openLead.id} lead={leads.find(l => l.id === openLead.id) || openLead} onClose={() => setOpenLead(null)} onAddNote={addNote} onMoveStage={moveStage} onMarkLost={markLost} onSendWhatsApp={sendWhatsApp} />
      )}
      {showInquiry && <NewInquiryModal onClose={() => setShowInquiry(false)} onCreate={createInquiry} />}
      {showSupplier && <NewSupplierModal onClose={() => setShowSupplier(false)} onCreate={createSupplier} />}
      {showHotel && <NewHotelModal onClose={() => setShowHotel(false)} onCreate={createHotel} />}
      {showVehicle && <NewVehicleModal onClose={() => setShowVehicle(false)} onCreate={createVehicle} />}
      {showQuotation && <NewQuotationModal onClose={() => setShowQuotation(false)} onCreate={createQuotation} leads={leads.filter(l => !l.lost)} />}
      {showInvoice && <NewInvoiceModal onClose={() => setShowInvoice(false)} onCreate={createInvoice} bookings={bookings} />}
    </div>
  );
}
