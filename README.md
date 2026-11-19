# Trailback

**Find your way back to your own thinking.** A local-first research history concept, delivered as a runnable interactive demo.

Explore 24 **synthetic visits** across three research sessions. Switch between an interactive navigation graph and timeline, search by keyword, inspect connection evidence, save trails, and annotate pages. Changes persist in this browser's localStorage. Domain deletion cleans up visits, edges, notes, and saved-trail references. Validated JSON import/export is included.

## Run

Requires Node.js 22.12+ and pnpm 10.

```sh
pnpm install
pnpm dev --host 0.0.0.0 --port 4173
```

Open http://localhost:4173. For a production build and local preview:

```sh
pnpm test
pnpm build
pnpm preview --host 0.0.0.0 --port 4173
```

## Try it

1. Select a research session and click any graph node.
2. Search for `SQLite` or switch to the timeline.
3. Save a filtered trail, or edit a page note and click **Save note**.
4. Visit **Privacy & data** to export, import, or delete a domain.
5. Use **Reset demo** to restore the examples.

Solid edges represent fictional explicit navigation events; dashed edges represent fictional temporal proximity, **not proof of navigation**. All displayed times use America/Los_Angeles (PST for these dates).

## Scope & privacy

This is a React + TypeScript + Vite frontend, not an extension or a database service. No real browsing history is collected. No application API calls, analytics, remote fonts, embeddings, or cloud account. Public URLs are real; visits, summaries, and edges are made up. Following an external link contacts that site.

LocalStorage is **not encrypted** and is not durable backup. Exported files include notes. Keep real sensitive data out of this demo. Imports accept version 1 and the three fixed demo session IDs, cap file/record sizes, sanitize HTTP(S) URLs, reject dangling references, and render imported text without executing markup. URL paths may still contain sensitive information. Exclusions match exact hostnames and survive replacement imports; explicitly resetting/clearing data removes them.

## Next, not implemented

Opt-in Chrome Manifest V3 capture → Chrome Native Messaging → a local SQLite/FTS5 index. Capture permissions, incognito handling, device installation, and production security review are future work. No performance or privacy claims are made for that future architecture.

See [architecture](docs/architecture.md) and [privacy](docs/privacy.md). Unit tests cover graph filtering, search, deletion, sanitization, import validation, and storage failure handling; no browser end-to-end suite is included.
