# Build Prompt: "Node 04" — The Analog Schism Lore Codex

Paste everything below into Claude or ChatGPT to build (or rebuild) this app from scratch.

---

## What to build

A single-page web app that acts as a living **world bible / lore codex** for a cyberpunk setting called **Veyra** (working title: "The Analog Schism"). It should function like an in-fiction terminal that recovered a fragment of the city's records — the interface itself should feel like an artifact of the world, not a generic wiki.

The app must be **modular**: the world's canon will keep expanding, so the data model and UI need to support adding, editing, connecting, and re-categorizing entries indefinitely without a redesign.

## Core data model

Each **entry** has:
- `id` (stable slug)
- `category` (one of a fixed set — see below, but the set should be easy to extend in code)
- `title`
- `summary` (1–2 sentences, shown on cards)
- `body` (longer lore text, shown on detail view)
- `tags` (free-form array, user-extensible)
- `connections` (array of other entry ids — this is what makes the codex feel like a web of lore, not a list)
- `createdAt` / `updatedAt`

## Canonical starting categories

- **Factions** (corporations, resistance sub-groups)
- **Characters**
- **Locations** (the city's physical layers)
- **Technology** (the "technology bible" rules)
- **History** (timeline events, sortable chronologically)
- **Culture & Belief** (religions, rituals, superstitions)
- **Resources & Economy**
- **The Blight** (the AI/entity lore — probably deserves its own category given how central it is)
- **Concepts** (Unification, Civic Score, Identity Severance, and other setting-specific terms)

## Required features

1. **Browse by category** — sidebar or top-nav with entry counts per category.
2. **Search** across title, summary, body, and tags.
3. **Tag filtering**, in addition to category filtering.
4. **Entry detail view** showing the full body text and clickable chips for every connected entry (clicking jumps to that entry).
5. **Add / edit / delete entries** through a form — this is the modularity requirement. No code changes should be needed to add new lore.
6. **Persistence** so entries survive a page reload/reopen. If building in an environment with a storage API available, use it; otherwise fall back to the best persistence method available in that environment (do not silently lose data on refresh).
7. **Empty and loading states** that stay in-voice with the world (e.g., a "no signal" / "node not found" treatment rather than a generic blank screen).
8. **Seed data**: pre-populate with the setting's current canon (paste your world bible content in as the seed, converted into entries with real connections between them — e.g., link the "Blight" entry to "Night of Mirrors," "Node 04," and each corporation that helped create it).

## Aesthetic direction

The world is built on a literal technological divide (sleek corporate tech vs. scavenged analog/CRT tech), so let that duality shape the interface rather than defaulting to a generic dark-mode dashboard:
- Treat the whole app as if you're looking at a recovered terminal/archive — monospace type for UI chrome and headers, a phosphor-glow accent color, subtle CRT/scanline texture, near-black background.
- Reserve a second accent color for corporate/"Crown" tagged content vs. underground/"Sub-Tier" tagged content, so the visual identity of an entry hints at which side of the world it belongs to.
- Keep it restrained — one strong signature effect (e.g., scanline overlay, boot-flicker on load, glowing focus states) rather than decoration everywhere.
- Fully responsive, keyboard-accessible, respects reduced-motion preferences.

## What NOT to do

- Don't hardcode the lore into the UI code such that adding a new faction or character requires editing components — it must go through the data layer / add-entry form.
- Don't use browser localStorage/sessionStorage if building inside Claude.ai artifacts specifically — use the artifact storage API instead (`window.storage.get/set/delete/list`); for any other environment, use whatever real persistence is available.
- Don't make it a static read-only reference — the point is a living document the worldbuilders keep adding to.

## Seed content

Paste your current world bible / canon document here before running this prompt, and instruct the assistant to convert it into seed entries following the data model above, preserving all specific proper nouns, factions, and relationships exactly as written.
