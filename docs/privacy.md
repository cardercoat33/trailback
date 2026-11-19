# Privacy boundaries

This demo has no extension privileges and never accesses browser history, tabs, forms, credentials, or incognito activity. There is no telemetry, remote font, fetched favicon, embedded remote page, or application network request. Vite's development server uses a local hot-reload connection; production assets do not require it.

Imported data is untrusted. The validator caps input at 2 MB, 500 visits, 1,500 edges and 100 saved trails, bounds text length, rejects duplicate/reserved IDs, checks timestamps and references, and accepts only HTTP(S) URLs. Credentials, queries and fragments are stripped before storage. Hostnames are normalized. Paths and note text are not redacted. React escapes all imported text; no HTML injection API or script evaluation is used.

Deleting an exact hostname removes its visits, notes, incident edges and trail references; empty trails disappear. The hostname becomes excluded from future imports. Existing exclusions survive replacement imports. Users can explicitly allow future imports again without restoring deleted data. Reset and clear actions require confirmation and remove exclusions too.

LocalStorage is readable to scripts on the same origin and people with access to the browser profile. It is not encrypted, securely erased, synced, or guaranteed durable. Exports are ordinary unencrypted files and include notes; deletion does not remove previous exports or browser backups. Do not import real sensitive history. Multi-tab edits can overwrite one another. External page links are explicit user actions and then subject to the destination's privacy policy.

No security certification is implied. A real capture extension would require a new threat model, domain-specific opt-in before reading metadata, sensitive-site exclusions, no incognito capture, and an audited native-messaging boundary. None of that is simulated as implemented functionality here.
