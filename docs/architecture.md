# Architecture

- `src/model.ts`: typed visits, evidence edges, saved trails, annotations; pure search/deletion; import validation and localStorage adapter.
- `src/seed.ts`: 24 fictional visits and connections across three fixed sessions, pointing to real public resources.
- `src/App.tsx`: SVG graph, timeline, session/search filters, page inspector, trails, privacy controls and dialogs.
- `src/style.css`: responsive layout using system fonts. No fetched assets.

A visit is an event, not a URL identity: repeat visits can have distinct IDs. Edges distinguish explicit `confirmed` evidence from `suggested` proximity. Search uses case-insensitive AND matching across title, URL, and synthetic description. Visible graph edges require both endpoints to be visible. Graph zoom is centered and bounded; there is no dragging or panning.

State is versioned JSON under `trailback.demo.v1` in localStorage. Writes are synchronous, validated and failure-aware. Invalid saved data is not overwritten on initial load; a warning accompanies fallback demo data. A later explicit edit replaces that saved data. There is no concurrent-tab synchronization: last successful write wins. Imports are replacements after confirmation and preserve current exact-host exclusions, cascading their deletions. Unknown fields are discarded; only supported demo session IDs are accepted.

The future extension/native-host/SQLite architecture is not implemented here. Its capture permission boundary must be established before collecting navigation metadata; temporal suggestions must never be upgraded into confirmed navigation evidence.
