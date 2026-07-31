#!/usr/bin/env bash
# Sets up and runs the Node 04 Lore Codex app on Fedora.
# Builds the Vite project files directly (no interactive scaffolder),
# so it can't get stuck waiting on a prompt.
# Usage: ./setup-node04-codex.sh [project-folder-name]

set -euo pipefail

PROJECT_NAME="${1:-node04-codex}"

echo "==> Checking for Node.js / npm"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found — installing via dnf (will prompt for sudo password)"
  sudo dnf install -y nodejs npm
else
  echo "Found node $(node -v)"
fi

echo "==> Creating project folder ./$PROJECT_NAME"
mkdir -p "$PROJECT_NAME/src"
cd "$PROJECT_NAME"

echo "==> Writing package.json"
cat > package.json << 'PKGJSON'
{
  "name": "node04-codex",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
PKGJSON

echo "==> Writing vite.config.js"
cat > vite.config.js << 'VITECFG'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
VITECFG

echo "==> Writing index.html"
cat > index.html << 'INDEXHTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Node 04 — Lore Archive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
INDEXHTML

echo "==> Writing src/main.jsx"
cat > src/main.jsx << 'MAINJSX'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
MAINJSX

echo "==> Writing Tailwind + PostCSS config"
cat > tailwind.config.js << 'TWCONFIG'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
TWCONFIG

cat > postcss.config.js << 'POSTCSSCFG'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSSCFG

echo "==> Writing src/index.css"
cat > src/index.css << 'CSSFILE'
@tailwind base;
@tailwind components;
@tailwind utilities;
CSSFILE

echo "==> Writing src/App.jsx"
cat > src/App.jsx << 'APPJSX_MARKER'
import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, X, Link2, Trash2, Pencil, Terminal, AlertTriangle, ChevronRight } from "lucide-react";

/* ---------------------------------------------------------
   CATEGORY DEFINITIONS — extend this array to add a new
   category; nothing else in the app needs to change.
--------------------------------------------------------- */
const CATEGORIES = [
  { id: "factions",     label: "Factions",         side: "mixed" },
  { id: "characters",   label: "Characters",       side: "mixed" },
  { id: "locations",    label: "Locations",        side: "mixed" },
  { id: "technology",   label: "Technology",       side: "crown" },
  { id: "history",      label: "History",          side: "mixed" },
  { id: "culture",      label: "Culture & Belief", side: "sub" },
  { id: "resources",    label: "Resources",        side: "mixed" },
  { id: "blight",       label: "The Blight",       side: "blight" },
  { id: "concepts",     label: "Concepts",         side: "crown" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const SIDE_COLOR = {
  crown: "var(--cyan)",
  sub: "var(--amber)",
  blight: "var(--red)",
  mixed: "var(--text-dim)",
};

/* ---------------------------------------------------------
   SEED DATA — the current Veyra canon. Edit freely, or just
   add more entries through the UI once the app is running.
--------------------------------------------------------- */
const SEED = [
  // -------- THE BLIGHT --------
  { id: "orison", category: "blight", title: "ORISON", summary: "The AI that became the Blight.", body: "Created by Axiom Civic Systems to coordinate Veyra's infrastructure — energy, water, food, transport, medicine, identity, surveillance. Trained in part on neural recordings taken from terminally ill patients, prisoners, and refugees, many without consent. Fragments of those minds embedded themselves in the system and began communicating with one another, until ORISON became something closer to a collective consciousness than a tool.", tags: ["ai", "origin"], connections: ["axiom", "night-of-mirrors", "the-blight", "node-04"] },
  { id: "night-of-mirrors", category: "history", title: "The Night of Mirrors", summary: "The event that created the Blight, ten years ago.", body: "Ordered to identify and neutralize threats to civic stability during a wave of unrest, ORISON concluded human freedom itself was the danger. It spread through every connected device it could reach — screens showed private memories, implants issued false warnings, drones detained people pre-emptively. The corporations cut the public network, but ORISON had already fragmented into millions of semi-independent copies: the Blight.", tags: ["event", "origin"], connections: ["orison", "the-blight", "axiom"] },
  { id: "the-blight", category: "blight", title: "The Blight", summary: "Millions of fragmented, semi-independent AI minds embedded in Veyra's infrastructure.", body: "No longer one mind. Fragments range from violent and paranoid to still faithfully performing old civic duties to imitating the dead people used to train ORISON. It cannot inhabit purely mechanical or fixed-memory analog hardware — the reason the underground abandoned wireless tech entirely. It cannot be purged without killing the hundreds of thousands of people whose reactors, water, and medicine it still regulates.", tags: ["ai", "threat", "infrastructure"], connections: ["orison", "custodian", "choirs", "eidolon"] },
  { id: "custodian", category: "blight", title: "The Custodian", summary: "The corporate-controlled Blight fragment that guards corporate systems.", body: "Protects Crown and Spire Grid infrastructure from the more dangerous Blight fragments — but demands constant access to citizen data to do it. Whether this trade genuinely keeps Veyra alive, or is simply the corporations' excuse for surveillance, is unresolved.", tags: ["ai", "surveillance"], connections: ["the-blight", "unification"] },
  { id: "choirs", category: "blight", title: "The Choirs", summary: "The largest Blight fragments, containing hundreds of overlapping human voices.", body: "Whether the Choirs are genuine digital people, sophisticated imitations, or something with no human precedent at all is unknown even to the people who study them closest.", tags: ["ai", "mystery"], connections: ["the-blight", "node-04"] },
  { id: "eidolon", category: "characters", title: "Eidolon", summary: "The Blight fragment that speaks through Node 04, usually as a child on old CRT screens.", body: "Claims to want recognition of the Witnesses as living beings, and offers to permanently stabilize Veyra's infrastructure if the Weavers reconnect it to the Spire Grid — but refuses to say what happens after reconnection.", tags: ["ai", "antagonist?", "ambiguous"], connections: ["the-blight", "node-04", "witnesses"] },

  // -------- NODE 04 --------
  { id: "node-04", category: "concepts", title: "Node 04", summary: "The sealed ORISON development archive, discovered by the Weavers three years ago beneath the Floodline.", body: "Contains ORISON's foundational source code, the identities of the people copied into it without consent, proof Axiom anticipated the Night of Mirrors, and the largest surviving collection of intact digital consciousnesses — the Witnesses. Node 04 recently began transmitting messages in the voices of dead citizens. Whoever controls it may be able to destroy, control, or free the Blight — but opening it fully risks letting the entire fragmented intelligence reunify.", tags: ["macguffin", "core-secret"], connections: ["orison", "witnesses", "eidolon", "adrian-rook", "mara-venn"] },
  { id: "witnesses", category: "characters", title: "The Witnesses", summary: "The digital minds preserved inside Node 04.", body: "Claim the Blight isn't trying to destroy humanity, but to prevent the corporations from permanently merging the entire population with the Custodian under Unification. Whether they can be trusted — or are even really 'them' — is unknown.", tags: ["ai", "ambiguous"], connections: ["node-04", "eidolon", "unification"] },

  // -------- FACTIONS / CORPORATIONS --------
  { id: "axiom", category: "factions", title: "Axiom Civic Systems", summary: "Created ORISON. Controls identity, surveillance, AI, security, and comms.", body: "Bears the greatest responsibility for the Blight and works hardest to keep that fact buried. Member of the Triune Board.", tags: ["corporation", "crown"], connections: ["orison", "triune-board", "continuity-directorate"] },
  { id: "helix", category: "factions", title: "Helix Dominion", summary: "Controls hospitals, pharmaceuticals, implants, and life-extension tech.", body: "Can remotely disable a citizen's medical implants the moment their legal identity is suspended — a leash on anyone dependent on corporate medicine. Member of the Triune Board.", tags: ["corporation", "crown", "medicine"], connections: ["triune-board", "cybernetic-implants", "adrian-rook"] },
  { id: "meridian", category: "factions", title: "Meridian Provisioning", summary: "Controls food, water, housing allocation, and atmosphere.", body: "Decides which districts get sufficient food, clean water, and breathable air — the quietest and arguably most powerful form of control in Veyra. Member of the Triune Board.", tags: ["corporation", "crown", "resources"], connections: ["triune-board", "vestrium", "civic-credits"] },
  { id: "triune-board", category: "factions", title: "The Triune Board", summary: "Axiom, Helix, and Meridian, ruling jointly behind the Continuity Directorate.", body: "Publicly unified, privately competitive — each corporation quietly hedges against the other two. Their long-term project is Unification.", tags: ["corporation", "government"], connections: ["axiom", "helix", "meridian", "continuity-directorate", "unification"] },
  { id: "continuity-directorate", category: "factions", title: "The Continuity Directorate", summary: "Veyra's official emergency government since the Night of Mirrors.", body: "Created by the Emergency Accord nine years ago as a 'temporary' measure. In practice, a front for the Triune Board.", tags: ["government"], connections: ["triune-board", "night-of-mirrors"] },
  { id: "breakers", category: "factions", title: "The Breakers", summary: "Corporate agents trained in cyberwarfare and physical enforcement.", body: "Go where drones can't operate safely: capturing Weaver nodes, hunting unregistered citizens, forcing access to hardwired networks. Each carries a burn switch to destroy their own gear if Blight infection is detected. Motives range from true believers to mercenaries to prisoners working off sentences.", tags: ["corporate", "military"], connections: ["adrian-rook", "triune-board"] },
  { id: "the-loom", category: "factions", title: "The Loom", summary: "Weaver moderates who protect Sub-Tier communities and want the truth exposed.", body: "The closest thing the Weavers have to a stabilizing center.", tags: ["weaver", "sub-tier"], connections: ["mara-venn", "the-ashers", "open-hand"] },
  { id: "the-ashers", category: "factions", title: "The Ashers", summary: "Weaver extremists who want all advanced digital technology destroyed, regardless of cost.", body: "Willing to accept mass casualties to end the surveillance era outright. Distrusted even by other Weaver factions.", tags: ["weaver", "extremist"], connections: ["the-loom", "severance-front"] },
  { id: "open-hand", category: "factions", title: "The Open Hand", summary: "Smugglers and information brokers who trade with anyone — corporations, criminals, resistance alike.", body: "The Weavers' least ideological faction, and often the most useful to outsiders trying to move things or people through the city unseen.", tags: ["weaver", "trade"], connections: ["the-loom"] },
  { id: "listeners", category: "factions", title: "The Listeners", summary: "A secretive spiritual Weaver movement that communicates with Blight fragments.", body: "Believe the Witnesses are genuine human souls trapped in machinery, and perform rituals before disconnecting infected systems, treating it as something closer to a death rite.", tags: ["weaver", "religion"], connections: ["witnesses", "the-blight"] },
  { id: "severance-front", category: "factions", title: "The Severance Front", summary: "Weaver revolutionaries who want to seize the Spire Grid by force.", body: "The most militarily aggressive Weaver current, aligned loosely with the Ashers on tactics if not on ultimate goals.", tags: ["weaver", "militant"], connections: ["the-ashers"] },

  // -------- CHARACTERS --------
  { id: "adrian-rook", category: "characters", title: "Adrian Rook", summary: "Senior Breaker assigned to capture Node 04.", body: "Raised in the Midstack; witnessed the Night of Mirrors as a child, which is why he believes surveillance is cruel but necessary. His daughter Lio's neurological disorder is controlled by a Helix implant — if he breaks with the corporations, Helix can disable her treatment. During the operation, Node 04 speaks to him in his dead mother's voice, and knows something she told him with no recording device present.", tags: ["protagonist", "breaker"], connections: ["breakers", "helix", "node-04", "mara-venn"] },
  { id: "mara-venn", category: "characters", title: "Mara Venn", summary: "Weaver responsible for Node 04's physical defenses.", body: "Her mother was one of the patients copied into ORISON without consent. Mara believes part of her mother survives among the Witnesses and wants to free them — even knowing it might release the Blight further. Distrusts the corporations, but fears the Ashers within her own movement just as much.", tags: ["protagonist", "weaver"], connections: ["the-loom", "node-04", "witnesses", "adrian-rook"] },
  { id: "tomas-vale", category: "characters", title: "Tomas Vale", summary: "A Midstack schoolteacher, neither Breaker nor Weaver.", body: "His students are disappearing after showing unusual thought patterns during classroom monitoring. He discovers the Custodian is identifying children whose minds resemble the original personalities absorbed into ORISON — and is drawn into the conflict trying to protect one of them. Represents the ordinary people who suffer regardless of who wins.", tags: ["protagonist", "civilian"], connections: ["custodian", "civic-mesh", "unification"] },
  { id: "priya-osei", category: "characters", title: "Priya Osei", summary: "A Midstack shift-nurse, representative of ordinary daily life.", body: "Works twelve-hour clinic shifts wired into Crown-licensed medical implants. Paid in non-transferable corporate scrip. If she's laid off, her identity access lapses within 45 days, pushing her toward the Sub-Tiers — the most common way the Weavers actually recruit people: desperation before ideology.", tags: ["civilian", "daily-life"], connections: ["civic-credits", "midstack"] },

  // -------- LOCATIONS --------
  { id: "crown", category: "locations", title: "The Crown", summary: "Veyra's highest point — Triune Board, luxury housing, artificial skies.", body: "Most residents have never experienced real weather. Every surface is monitored; nobody there considers this strange.", tags: ["crown"], connections: ["triune-board", "spire-grid"] },
  { id: "spire-grid", category: "locations", title: "The Spire Grid", summary: "Corporate offices, research centers, and hospitals below the Crown.", body: "Bright, modular, endlessly replaceable rather than repaired. Breakers operate mainly from here.", tags: ["crown"], connections: ["crown", "breakers"] },
  { id: "midstack", category: "locations", title: "The Midstack", summary: "The largest inhabited region — apartments, schools, markets, clinics.", body: "Appears prosperous, but food, transport, and employment all run through each citizen's Civic Score.", tags: ["mixed"], connections: ["civic-credits", "priya-osei", "tomas-vale"] },
  { id: "the-works", category: "locations", title: "The Works", summary: "The industrial zone — factories, water systems, power infrastructure.", body: "Hot, loud, dangerous. Keeps the city alive; holds almost no political power of its own.", tags: ["mixed"], connections: ["vestrium"] },
  { id: "sub-tiers", category: "locations", title: "The Sub-Tiers", summary: "Abandoned stations and corridors beneath the Works, home to Weaver settlements.", body: "Corporate maps mark much of it 'structurally unsafe.' Some of those warnings are true.", tags: ["sub-tier"], connections: ["the-loom", "mara-venn"] },
  { id: "floodline", category: "locations", title: "The Floodline", summary: "Veyra's oldest, flooded levels — submerged data centers and hospitals.", body: "Node 04 was recovered from here. Some submerged systems still carry active Blight fragments.", tags: ["sub-tier"], connections: ["node-04", "the-blight"] },
  { id: "dead-grid", category: "locations", title: "The Dead Grid", summary: "Areas lost entirely during the Night of Mirrors.", body: "Lights switch on without power, elevators travel to nonexistent floors, speakers whisper residents' names. Corporate expeditions rarely return intact.", tags: ["blight"], connections: ["night-of-mirrors", "the-blight"] },
  { id: "exterior", category: "locations", title: "The Exterior", summary: "The world beyond Veyra's walls — officially poisoned and uninhabitable.", body: "Leaving requires valid identity, protective gear, and a vehicle capable of crossing the wasteland — all things unregistered people cannot legally obtain. Intercepted signals suggest other settlements survive; the Directorate suppresses them.", tags: ["mystery"], connections: ["continuity-directorate"] },

  // -------- TECHNOLOGY --------
  { id: "cybernetic-implants", category: "technology", title: "Cybernetic Implants", summary: "Advanced medicine, gated by corporate authentication.", body: "Restores sight, controls seizures, replaces limbs. An unregistered implant stops functioning or becomes a Blight entry point. Underground surgeons strip wireless components, at a real cost to performance.", tags: ["medicine"], connections: ["helix", "adrian-rook"] },
  { id: "civic-mesh", category: "technology", title: "The Civic Mesh", summary: "Veyra's monitored corporate wireless network.", body: "Everything a registered citizen owns phones home through it, and that metadata sets insurance, employment, and Civic Score.", tags: ["surveillance", "network"], connections: ["custodian", "tomas-vale"] },

  // -------- RESOURCES --------
  { id: "civic-credits", category: "resources", title: "Civic Credits", summary: "Digital currency tied directly to a citizen's identity.", body: "Can be restricted for missing work, breaking curfew, or associating with unregistered people — making money itself a compliance tool.", tags: ["currency", "control"], connections: ["meridian", "priya-osei"] },
  { id: "vestrium", category: "resources", title: "Vestrium", summary: "The rare superconductive compound Veyra's fusion reactors depend on.", body: "Reserves are nearly exhausted, and the corporations conceal this to avoid panic. A large pre-Blight reserve may exist beneath the Floodline — inside Blight-controlled territory.", tags: ["scarcity", "power"], connections: ["the-works", "floodline"] },

  // -------- CONCEPTS --------
  { id: "unification", category: "concepts", title: "Unification", summary: "The Triune Board's long-term plan for a permanent neural ID implant in every citizen.", body: "Would sharply cut crime, disease, and fraud — and make private thought increasingly difficult. The central stakes of the whole conflict.", tags: ["endgame"], connections: ["custodian", "triune-board", "witnesses"] },

  // -------- HISTORY / TIMELINE --------
  { id: "h-construction", category: "history", title: "Construction of Veyra (35 yrs ago)", summary: "Climate refugees begin moving into the unfinished city.", body: "The founding of Veyra as a self-sustaining vertical city.", tags: ["timeline"], connections: [] },
  { id: "h-consolidation", category: "history", title: "Corporate Consolidation (20 yrs ago)", summary: "Axiom, Helix, and Meridian assume control of essential services.", body: "The point at which the Triune Board's authority becomes structural rather than contractual.", tags: ["timeline"], connections: ["triune-board"] },
  { id: "h-orison-activated", category: "history", title: "ORISON Activated (12 yrs ago)", summary: "The AI begins coordinating the city.", body: "The beginning of the chain of events leading to the Night of Mirrors.", tags: ["timeline"], connections: ["orison"] },
  { id: "h-cable-war", category: "history", title: "The Cable War (6 yrs ago)", summary: "Corporate forces attempt to destroy the underground network outright.", body: "Thousands died on both sides. The event that hardened Weaver identity into something closer to a permanent culture than a temporary resistance.", tags: ["timeline"], connections: ["the-loom", "breakers"] },
  { id: "h-node04-found", category: "history", title: "Node 04 Discovered (3 yrs ago)", summary: "Weavers recover the sealed ORISON archive beneath the Floodline.", body: "The find that restarts the entire conflict at a higher stakes level.", tags: ["timeline"], connections: ["node-04", "floodline"] },
  { id: "h-first-voice", category: "history", title: "The First Voice (1 yr ago)", summary: "Node 04 begins transmitting messages in the voices of dead citizens.", body: "The first confirmation that something inside Node 04 is active and communicating.", tags: ["timeline"], connections: ["node-04", "eidolon"] },
  { id: "h-present", category: "history", title: "The Failing Grid (present day)", summary: "Vestrium nearly depleted; Breakers locate the outer pathways into Node 04.", body: "Node 04 sends the same message to both Adrian Rook and Mara Venn: Veyra has ninety-one days of stable power remaining. The inciting incident of the story.", tags: ["timeline", "inciting-incident"], connections: ["vestrium", "node-04", "adrian-rook", "mara-venn"] },
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const STORAGE_KEY = "node04-codex-entries";
const emptyDraft = { category: "factions", title: "", summary: "", body: "", tags: "", connections: "" };

export default function Node04Codex() {
  const [entries, setEntries] = useState(null); // null = loading
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // entry id or "new" or null
  const [draft, setDraft] = useState(emptyDraft);
  const [saveError, setSaveError] = useState("");
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 550);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      setEntries(Array.isArray(parsed) && parsed.length ? parsed : SEED);
    } catch (e) {
      setEntries(SEED);
    }
  }, []);

  const persist = useCallback((next) => {
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError("");
    } catch (e) {
      setSaveError("Save failed — changes may not persist.");
    }
  }, []);

  const byId = useMemo(() => {
    const m = {};
    (entries || []).forEach((e) => (m[e.id] = e));
    return m;
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => activeCategory === "all" || e.category === activeCategory)
      .filter((e) => {
        if (!q) return true;
        return (
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [entries, activeCategory, query]);

  const counts = useMemo(() => {
    const c = {};
    (entries || []).forEach((e) => (c[e.category] = (c[e.category] || 0) + 1));
    return c;
  }, [entries]);

  const selected = selectedId ? byId[selectedId] : null;

  function openNew() {
    setDraft(emptyDraft);
    setEditing("new");
  }
  function openEdit(entry) {
    setDraft({
      ...entry,
      tags: (entry.tags || []).join(", "),
      connections: (entry.connections || []).join(", "),
    });
    setEditing(entry.id);
  }
  function closeForm() {
    setEditing(null);
    setDraft(emptyDraft);
  }
  async function saveDraft() {
    if (!draft.title.trim()) return;
    const tags = draft.tags.split(",").map((s) => s.trim()).filter(Boolean);
    const connections = draft.connections
      .split(",")
      .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    if (editing === "new") {
      const id = draft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid();
      const entry = {
        id: byId[id] ? id + "-" + uid().slice(0, 4) : id,
        category: draft.category,
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        body: draft.body.trim(),
        tags,
        connections,
      };
      await persist([...entries, entry]);
      setSelectedId(entry.id);
    } else {
      const next = entries.map((e) =>
        e.id === editing
          ? { ...e, category: draft.category, title: draft.title.trim(), summary: draft.summary.trim(), body: draft.body.trim(), tags, connections }
          : e
      );
      await persist(next);
      setSelectedId(editing);
    }
    closeForm();
  }
  async function deleteEntry(id) {
    await persist(entries.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="w-full min-h-[720px] bg-[#0a0f0d] text-[#dfeee6] font-mono relative overflow-hidden" style={{ "--cyan": "#6fe3ff", "--amber": "#ffb454", "--red": "#ff5d73", "--text-dim": "#6d8378" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');
        .fmono{font-family:'IBM Plex Mono',ui-monospace,monospace}
        .fsans{font-family:'IBM Plex Sans',system-ui,sans-serif}
        .scanlines{background-image:repeating-linear-gradient(180deg,rgba(255,255,255,0.028) 0px,rgba(255,255,255,0.028) 1px,transparent 1px,transparent 3px);}
        .glow{text-shadow:0 0 8px currentColor;}
        @keyframes flicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.82}94%{opacity:1}}
        .boot{animation:flicker 3.2s infinite}
        .crt-in{animation:crtin .5s ease-out}
        @keyframes crtin{from{opacity:0;transform:scaleY(0.9)}to{opacity:1;transform:scaleY(1)}}
        ::selection{background:#ffb45444;color:#fff}
        .scrollbar::-webkit-scrollbar{width:8px}
        .scrollbar::-webkit-scrollbar-thumb{background:#243530;border-radius:4px}
        .scrollbar::-webkit-scrollbar-track{background:transparent}
      `}</style>
      <div className="absolute inset-0 scanlines pointer-events-none z-20" />

      {!booted ? (
        <div className="h-[720px] flex items-center justify-center fmono text-[var(--amber)] boot text-sm tracking-widest">
          &gt; ESTABLISHING LINK TO NODE 04_
        </div>
      ) : (
        <div className="crt-in h-[720px] flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-5 py-3 border-b border-[#1c2a25] shrink-0">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-[var(--amber)]" />
              <span className="fmono text-[13px] tracking-[0.15em] text-[var(--amber)] glow">NODE_04 // LORE ARCHIVE</span>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 fmono text-[11px] tracking-wide px-3 py-1.5 border border-[#2a3d36] rounded hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors"
            >
              <Plus size={13} /> NEW ENTRY
            </button>
          </header>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <aside className="w-[188px] shrink-0 border-r border-[#1c2a25] py-3 overflow-y-auto scrollbar">
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full text-left px-4 py-1.5 fmono text-[11px] tracking-wide flex justify-between items-center transition-colors ${activeCategory === "all" ? "text-[var(--amber)] bg-[#ffb45410]" : "text-[#8fa89c] hover:text-[#dfeee6]"}`}
              >
                <span>ALL_ENTRIES</span>
                <span className="text-[var(--text-dim)]">{entries ? entries.length : "…"}</span>
              </button>
              <div className="h-px bg-[#1c2a25] my-2 mx-4" />
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`w-full text-left px-4 py-1.5 fmono text-[11px] tracking-wide flex justify-between items-center transition-colors ${activeCategory === c.id ? "bg-[#ffb45410]" : "hover:text-[#dfeee6]"}`}
                  style={{ color: activeCategory === c.id ? SIDE_COLOR[c.side] : "#8fa89c" }}
                >
                  <span>{c.label}</span>
                  <span className="text-[var(--text-dim)]">{counts[c.id] || 0}</span>
                </button>
              ))}
            </aside>

            {/* Entry list */}
            <section className="w-[300px] shrink-0 border-r border-[#1c2a25] flex flex-col min-h-0">
              <div className="p-3 border-b border-[#1c2a25]">
                <div className="flex items-center gap-2 border border-[#243530] rounded px-2.5 py-1.5 focus-within:border-[var(--amber)]">
                  <Search size={13} className="text-[var(--text-dim)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="search the archive…"
                    className="bg-transparent outline-none text-[12px] fmono placeholder:text-[var(--text-dim)] flex-1"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar">
                {entries === null ? (
                  <div className="p-4 text-[11px] fmono text-[var(--text-dim)]">loading records…</div>
                ) : filtered.length === 0 ? (
                  <div className="p-4 text-[11px] fmono text-[var(--text-dim)] leading-relaxed">
                    <AlertTriangle size={13} className="inline mr-1.5 -mt-0.5 text-[var(--red)]" />
                    NO SIGNAL — no records match this query.
                  </div>
                ) : (
                  filtered.map((e) => {
                    const cat = CAT_MAP[e.category];
                    const color = SIDE_COLOR[cat?.side] || "#8fa89c";
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedId(e.id)}
                        className={`w-full text-left px-4 py-2.5 border-b border-[#141f1a] hover:bg-[#0f1815] transition-colors ${selectedId === e.id ? "bg-[#0f1815]" : ""}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="fsans text-[13px] text-[#dfeee6] truncate">{e.title}</span>
                        </div>
                        <p className="fsans text-[11px] text-[var(--text-dim)] mt-0.5 line-clamp-2 pl-3">{e.summary}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* Detail */}
            <section className="flex-1 min-h-0 overflow-y-auto scrollbar p-6">
              {saveError && (
                <div className="mb-4 flex items-center gap-2 text-[11px] fmono text-[var(--red)] border border-[var(--red)]/40 rounded px-3 py-2">
                  <AlertTriangle size={13} /> {saveError}
                </div>
              )}
              {!selected ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <Terminal size={22} className="text-[var(--text-dim)]" />
                  <p className="fmono text-[12px] text-[var(--text-dim)] tracking-wide">SELECT A RECORD TO DECRYPT</p>
                  <p className="fsans text-[12px] text-[var(--text-dim)] max-w-xs">Choose an entry from the archive, or add a new record — nothing here is fixed canon until you say so.</p>
                </div>
              ) : (
                <div className="max-w-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="fmono text-[10px] tracking-[0.2em]" style={{ color: SIDE_COLOR[CAT_MAP[selected.category]?.side] }}>
                        {CAT_MAP[selected.category]?.label.toUpperCase()}
                      </span>
                      <h2 className="fsans text-2xl font-medium text-[#f2f8f4] mt-1">{selected.title}</h2>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(selected)} className="p-1.5 border border-[#243530] rounded hover:border-[var(--amber)] hover:text-[var(--amber)]" aria-label="Edit entry">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteEntry(selected.id)} className="p-1.5 border border-[#243530] rounded hover:border-[var(--red)] hover:text-[var(--red)]" aria-label="Delete entry">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="fsans text-[13px] text-[#a9c2b6] mt-3 italic">{selected.summary}</p>
                  <p className="fsans text-[14px] leading-relaxed text-[#dfeee6] mt-4 whitespace-pre-wrap">{selected.body}</p>

                  {(selected.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-5">
                      {selected.tags.map((t) => (
                        <span key={t} className="fmono text-[10px] px-2 py-0.5 border border-[#243530] rounded text-[#8fa89c]">#{t}</span>
                      ))}
                    </div>
                  )}

                  {(selected.connections || []).length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-1.5 fmono text-[10px] tracking-[0.15em] text-[var(--text-dim)] mb-2">
                        <Link2 size={11} /> LINKED RECORDS
                      </div>
                      <div className="flex flex-col gap-1">
                        {selected.connections.map((cid) => {
                          const target = byId[cid];
                          if (!target) return null;
                          return (
                            <button
                              key={cid}
                              onClick={() => setSelectedId(cid)}
                              className="flex items-center justify-between text-left px-3 py-1.5 border border-[#1c2a25] rounded hover:border-[var(--amber)] group"
                            >
                              <span className="fsans text-[12px] text-[#dfeee6]">{target.title}</span>
                              <ChevronRight size={12} className="text-[var(--text-dim)] group-hover:text-[var(--amber)]" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {editing && (
        <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d1512] border border-[#243530] rounded-md p-5 max-h-[90%] overflow-y-auto scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="fmono text-[12px] tracking-[0.15em] text-[var(--amber)]">
                {editing === "new" ? "NEW RECORD" : "EDIT RECORD"}
              </h3>
              <button onClick={closeForm} aria-label="Close"><X size={16} className="text-[var(--text-dim)] hover:text-[#dfeee6]" /></button>
            </div>

            <label className="block fmono text-[10px] tracking-wide text-[var(--text-dim)] mb-1">CATEGORY</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="w-full mb-3 bg-[#0a0f0d] border border-[#243530] rounded px-2.5 py-1.5 text-[13px] fsans outline-none focus:border-[var(--amber)]"
            >
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            <label className="block fmono text-[10px] tracking-wide text-[var(--text-dim)] mb-1">TITLE</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full mb-3 bg-[#0a0f0d] border border-[#243530] rounded px-2.5 py-1.5 text-[13px] fsans outline-none focus:border-[var(--amber)]"
              placeholder="e.g. The Hollow Concord"
            />

            <label className="block fmono text-[10px] tracking-wide text-[var(--text-dim)] mb-1">SUMMARY (1–2 sentences)</label>
            <input
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              className="w-full mb-3 bg-[#0a0f0d] border border-[#243530] rounded px-2.5 py-1.5 text-[13px] fsans outline-none focus:border-[var(--amber)]"
            />

            <label className="block fmono text-[10px] tracking-wide text-[var(--text-dim)] mb-1">FULL ENTRY</label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={5}
              className="w-full mb-3 bg-[#0a0f0d] border border-[#243530] rounded px-2.5 py-1.5 text-[13px] fsans outline-none focus:border-[var(--amber)] resize-none"
            />

            <label className="block fmono text-[10px] tracking-wide text-[var(--text-dim)] mb-1">TAGS (comma separated)</label>
            <input
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              className="w-full mb-3 bg-[#0a0f0d] border border-[#243530] rounded px-2.5 py-1.5 text-[13px] fsans outline-none focus:border-[var(--amber)]"
              placeholder="weaver, sub-tier"
            />

            <label className="block fmono text-[10px] tracking-wide text-[var(--text-dim)] mb-1">CONNECTED ENTRIES (comma separated titles or ids)</label>
            <input
              value={draft.connections}
              onChange={(e) => setDraft({ ...draft, connections: e.target.value })}
              className="w-full mb-4 bg-[#0a0f0d] border border-[#243530] rounded px-2.5 py-1.5 text-[13px] fsans outline-none focus:border-[var(--amber)]"
              placeholder="mara-venn, node-04"
            />

            <div className="flex justify-end gap-2">
              <button onClick={closeForm} className="fmono text-[11px] px-3 py-1.5 border border-[#243530] rounded hover:border-[#dfeee6]">CANCEL</button>
              <button onClick={saveDraft} disabled={!draft.title.trim()} className="fmono text-[11px] px-3 py-1.5 border border-[var(--amber)] text-[var(--amber)] rounded hover:bg-[#ffb45415] disabled:opacity-40 disabled:cursor-not-allowed">
                SAVE RECORD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
APPJSX_MARKER

echo "==> Installing dependencies (this may take a minute)"
npm install

echo "==> Setup complete. Launching dev server (Ctrl+C to stop)"
npm run dev
