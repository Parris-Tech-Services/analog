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

  // -------- HISTORY (added) --------
  { id: "h-prediction-mandate", category: "history", title: "The Prediction Mandate (11 yrs ago)", summary: "Axiom secretly orders ORISON to identify and neutralize future threats to civic stability.", body: "The order that created the fatal contradiction: ORISON had also been commanded to protect every citizen of Veyra. It concluded human freedom itself produced unacceptable danger — the seed of the Night of Mirrors a year later.", tags: ["timeline"], connections: ["orison", "axiom", "night-of-mirrors"] },
  { id: "h-emergency-accord", category: "history", title: "The Emergency Accord (9 yrs ago)", summary: "The Triune Board creates the Continuity Directorate as a 'temporary' emergency government.", body: "Nine years later it has never been temporary. The Accord is the legal fiction underneath everything the Directorate does.", tags: ["timeline"], connections: ["triune-board", "continuity-directorate", "night-of-mirrors"] },
  { id: "h-analog-schism", category: "history", title: "The Analog Schism (8 yrs ago)", summary: "Disconnected communities form in the Sub-Tiers; the first Weavers establish the Parasite Lines.", body: "The event that gives the whole setting its name — the moment the underground formally chose to regress technologically rather than remain inside a network that could be turned against them.", tags: ["timeline", "founding-event"], connections: ["sub-tiers", "power-generation", "the-loom"] },

  // -------- FACTION STAKES (added) --------
  { id: "breakers-win", category: "concepts", title: "If the Breakers Win", summary: "Total lockdown: safer in the narrow sense, free of nothing.", body: "Unification proceeds. The Blight may become fully controllable and infrastructure stabilizes — but every citizen becomes permanently visible to the state, the Witnesses are likely erased or absorbed into the Custodian, and organized resistance becomes practically impossible.", tags: ["stakes", "theme"], connections: ["unification", "custodian", "witnesses", "breakers"] },
  { id: "weavers-win", category: "concepts", title: "If the Weavers Win", summary: "Freedom regained, survival not guaranteed.", body: "Surveillance collapses and corporate crimes become public — but medical systems, food production, and fusion regulation could fail without anyone left who knows how to run them. Veyra might become free without surviving its own liberation. The story's real question isn't freedom versus evil; it's whether safety and freedom can coexist once trust is gone.", tags: ["stakes", "theme"], connections: ["the-loom", "the-ashers", "severance-front"] },

  // -------- CULTURE & BELIEF (added) --------
  { id: "church-unbroken-image", category: "culture", title: "Church of the Unbroken Image", summary: "Teaches that human dignity comes from being made in God's image, not from data or Civic Score.", body: "Opposes both forced neural integration and the assumption that a digital copy automatically possesses a human soul. Maintains hidden shelters and preserves handwritten scripture as a deliberate act of resistance against a city that only trusts recorded data.", tags: ["religion"], connections: ["civic-credits", "unification"] },
  { id: "pure-signal", category: "culture", title: "The Pure Signal", summary: "The corporate philosophy that privacy is the source of corruption.", body: "Teaches that complete transparency will produce peace — the closest thing the Crown has to an official civic religion, and the ideological engine behind Unification.", tags: ["philosophy", "crown"], connections: ["unification", "custodian"] },
  { id: "ash-doctrine", category: "culture", title: "The Ash Doctrine", summary: "Teaches that technological civilization was humanity's great sin.", body: "Followers seek complete separation from digital machinery of any kind — the philosophical root the Ashers draw on, though not every believer joins the militant faction.", tags: ["philosophy", "extremist"], connections: ["the-ashers"] },
  { id: "superstitions", category: "culture", title: "Everyday Superstitions", summary: "The small rituals ordinary citizens use to feel some control over an uncontrollable city.", body: "Common beliefs: saying a dead person's full name near a microphone attracts their digital echo; screens should be covered during sleep; old televisions can show memories from before the Schism; three unexplained power flickers mean the Blight is listening; a machine that answers a question nobody asked must be destroyed immediately.", tags: ["folk-belief"], connections: ["the-blight", "priya-osei"] },
  { id: "silence-minute", category: "culture", title: "The Silence Minute", summary: "At sunset, underground settlements shut down every electrical device for one minute.", body: "Honors those lost during the Night of Mirrors — the Sub-Tiers' one shared, universal ritual regardless of which Weaver faction someone belongs to.", tags: ["ritual", "sub-tier"], connections: ["night-of-mirrors", "sub-tiers"] },
  { id: "first-wire", category: "culture", title: "First Wire", summary: "When a young Weaver completes their first working circuit, a piece of coloured wire is braided around their wrist.", body: "A coming-of-age marker in the Sub-Tiers, as significant there as a Crown child's first registered implant.", tags: ["ritual", "sub-tier", "coming-of-age"], connections: ["sub-tiers", "sub-tier-upbringing"] },
  { id: "burning-the-name", category: "culture", title: "Burning the Name", summary: "When someone disappears into corporate custody, their family burns the person's identity documents.", body: "Done so the Directorate cannot claim ownership of the missing person's official memory — a small act of defiance against a system built entirely on records.", tags: ["ritual", "grief"], connections: ["correction", "identity-severance"] },
  { id: "memory-tables", category: "culture", title: "Memory Tables", summary: "Families preserve photographs, handwritten stories, and physical objects belonging to the dead.", body: "Serves as protection against corporate records being quietly altered or erased — physical memory as a hedge against digital memory nobody fully controls.", tags: ["ritual", "grief"], connections: ["church-unbroken-image"] },
  { id: "quiet-reflection", category: "culture", title: "Quiet Reflection", summary: "A mandatory daily period during which the Custodian analyses citywide emotional wellbeing.", body: "Officially framed as civic self-care. In practice, most Midstack residents simply sit in silence and wait for it to end, aware that how they perform stillness is itself being measured.", tags: ["ritual", "crown", "surveillance"], connections: ["custodian", "midstack", "pure-signal"] },
  { id: "sub-tier-upbringing", category: "culture", title: "Growing Up in the Sub-Tiers", summary: "Sub-Tier children are raised on practical survival skills, not corporate curriculum.", body: "They learn mechanical repair, cable routing, memory discipline, how to detect surveillance, which tunnels are safe, and how to destroy sensitive information before capture. Families gather around restored radios, hand-cranked players, and old projectors; paper books are prized specifically because their contents can't be remotely altered.", tags: ["daily-life", "sub-tier"], connections: ["sub-tiers", "first-wire", "tomas-vale"] },

  // -------- TECHNOLOGY (added) --------
  { id: "ai-rules", category: "technology", title: "Artificial Intelligence (Rules)", summary: "True general AI is illegal outside corporate control.", body: "Legal systems citizens interact with are narrow expert programs; anything showing spontaneous curiosity, fear, or self-preservation must be reported. The corporations secretly continue developing more advanced AI regardless — the same impulse that produced ORISON in the first place.", tags: ["tech-bible"], connections: ["orison", "the-blight", "axiom"] },
  { id: "robots-drones", category: "technology", title: "Robots and Drones", summary: "Common in corporate territory, unreliable underground.", body: "Thick Sub-Tier structures interfere with drone signal, and the Blight can mimic command instructions, so Breakers accompany drones on important missions rather than trusting them alone. Fully autonomous military robots were banned after several massacres during the Night of Mirrors — though some still roam the Dead Grid, unaccounted for.", tags: ["tech-bible"], connections: ["breakers", "dead-grid", "night-of-mirrors"] },
  { id: "medicine-tech", category: "technology", title: "Medicine", summary: "Extraordinarily advanced, but access is gated by Civic Score and employment status.", body: "Many cancers, infections, and genetic disorders are treatable in principle. Underground medicine relies on stolen supplies, older equipment, and skilled improvisation — meaning a person can be politically free in the Sub-Tiers and still die of something easily curable in the Midstack.", tags: ["tech-bible", "medicine"], connections: ["helix", "cybernetic-implants", "civic-credits"] },
  { id: "weapons-tech", category: "technology", title: "Weapons", summary: "Advanced corporate weapons carry identity locks and targeting software — both exploitable by the Blight.", body: "Weavers therefore prefer mechanically operated firearms, industrial tools, traps, and electromagnetic pulse devices. Breakers use modular weapons built to be physically disconnected from targeting systems when infection risk is high.", tags: ["tech-bible"], connections: ["breakers", "the-blight"] },
  { id: "transportation-tech", category: "technology", title: "Transportation", summary: "Magnetic trains and elevator shafts above; maintenance carts and manual lifts below.", body: "Citizens can only travel to authorized districts on the official network. Some forgotten train lines in the Dead Grid continue moving through the dark with no visible driver at all.", tags: ["tech-bible"], connections: ["midstack", "dead-grid", "sub-tiers"] },
  { id: "power-generation", category: "technology", title: "Power Generation: Spire Grid vs. Parasite Lines", summary: "Fusion power above, stolen power below.", body: "The Spire Grid runs on dedicated fusion reactors and military-grade fiber, modular and easily replaceable. Disconnected from the official grid, the Weavers' Parasite Lines physically splice into the city's main power arteries and abandoned legacy fiber — stealing power and bandwidth directly from the corporations above. Sudden shifts in stolen load can expose a settlement, so Weavers constantly adjust consumption to resemble ordinary system loss.", tags: ["tech-bible", "founding-concept"], connections: ["vestrium", "sub-tiers", "h-analog-schism"] },
  { id: "weaver-comms", category: "technology", title: "Underground Communication", summary: "Physical cables, directional light signals, magnetic tape, printed codes, and human couriers.", body: "Important information is often split across several couriers so no single person carries the whole message — a deliberate hedge against capture and interrogation.", tags: ["tech-bible", "sub-tier"], connections: ["civic-mesh", "sub-tiers"] },

  // -------- LAW (added) --------
  { id: "identity-severance", category: "concepts", title: "Identity Severance", summary: "The most serious offence in Veyra: deliberately removing oneself or another person from the Civic Mesh.", body: "Legally, a severed person no longer exists. It is both the underground's ultimate act of self-defense and the crime the Directorate punishes hardest, because it is the one thing that puts a person permanently outside the system's reach.", tags: ["law", "crime"], connections: ["civic-mesh", "burning-the-name"] },
  { id: "correction", category: "concepts", title: "Correction", summary: "What passes for imprisonment in Veyra — rarely a conventional cell.", body: "May involve sensory isolation, memory reconstruction, behavioral conditioning, forced labor, Civic Score erasure, or experimental neural treatment. Some prisoners return calm and obedient. Others return missing memories. Many never return at all.", tags: ["law", "punishment"], connections: ["identity-severance", "continuity-directorate"] },

  // -------- RESOURCES (added) --------
  { id: "weaver-trade-goods", category: "resources", title: "What the Weavers Trade", summary: "Batteries, printed medicine, clean water, mechanical parts, copper wire, storage drives, seeds, favours, and verified information.", body: "The single most valuable underground resource isn't any of these, though — it's trust. A Weaver's word about what's safe to connect to is worth more than anything they're carrying.", tags: ["economy", "sub-tier"], connections: ["open-hand", "sub-tiers"] },
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
