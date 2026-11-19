export const STORAGE_KEY = 'trailback.demo.v1';
export const SESSIONS = [
  { id: 'database', name: 'A better local search', date: 'Nov 17', description: 'SQLite, indexes & little discoveries', color: '#3973bf', icon: 'database' },
  { id: 'maps', name: 'Maps worth getting lost in', date: 'Nov 16', description: 'Cartography, trails & open data', color: '#a47942', icon: 'map' },
  { id: 'garden', name: 'A small balcony garden', date: 'Nov 15', description: 'Native plants & a greener corner', color: '#487b64', icon: 'leaf' },
] as const;
export type SessionId = typeof SESSIONS[number]['id'];
export type Visit = { id: string; title: string; url: string; summary: string; at: string; sessionId: SessionId };
export type Edge = { id: string; source: string; target: string; kind: 'confirmed' | 'suggested' };
export type Trail = { id: string; name: string; visitIds: string[] };
export type State = { version: 1; visits: Visit[]; edges: Edge[]; trails: Trail[]; notes: Record<string, string>; excludedDomains: string[] };
export function sanitizeUrl(raw: string): string {
  const u = new URL(raw);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http(s) URLs are allowed.');
  if (!u.hostname || u.hostname.length > 253) throw new Error('Invalid domain.');
  u.username = ''; u.password = ''; u.search = ''; u.hash = '';
  return u.toString();
}
export const domainOf = (v: Visit) => new URL(v.url).hostname;
export function searchVisits(visits: Visit[], query: string): Visit[] {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return visits.filter(v => words.every(w => `${v.title} ${v.url} ${v.summary}`.toLocaleLowerCase().includes(w)));
}
export function visibleEdges(edges: Edge[], visits: Visit[]): Edge[] {
  const ids = new Set(visits.map(v => v.id));
  return edges.filter(e => ids.has(e.source) && ids.has(e.target));
}
export function deleteDomain(state: State, domain: string): State {
  const visits = state.visits.filter(v => domainOf(v) !== domain);
  const ids = new Set(visits.map(v => v.id));
  return { ...state, visits, edges: visibleEdges(state.edges, visits),
    notes: Object.fromEntries(Object.entries(state.notes).filter(([id]) => ids.has(id))),
    trails: state.trails.map(t => ({ ...t, visitIds: t.visitIds.filter(id => ids.has(id)) })).filter(t => t.visitIds.length > 0),
    excludedDomains: [...new Set([...state.excludedDomains, domain])] };
}
function object(x: unknown): Record<string, unknown> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('Expected an object.');
  return x as Record<string, unknown>;
}
function text(x: unknown, max: number, allowEmpty = false): string {
  if (typeof x !== 'string' || x.length > max || (!allowEmpty && !x.trim())) throw new Error('Invalid text field.');
  return x;
}
function list(x: unknown, max: number): unknown[] {
  if (!Array.isArray(x) || x.length > max) throw new Error(`Expected a list with at most ${max} entries.`);
  return x;
}
function id(x: unknown): string {
  const value = text(x, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(value) || ['__proto__', 'constructor', 'prototype'].includes(value)) throw new Error('Invalid identifier.');
  return value;
}
function unique(values: string[]) { if (new Set(values).size !== values.length) throw new Error('Duplicate identifiers.'); }
export function validateState(input: unknown): State {
  const root = object(input);
  if (root.version !== 1) throw new Error('Unsupported file version. Expected Trailback version 1.');
  const visits: Visit[] = list(root.visits, 500).map(raw => {
    const v = object(raw); const at = text(v.at, 40);
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(at) || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString().slice(0,19) !== at.slice(0,19)) throw new Error('Invalid visit timestamp.');
    if (!SESSIONS.some(s => s.id === v.sessionId)) throw new Error('Unknown demo session.');
    return { id: id(v.id), title: text(v.title, 200), url: sanitizeUrl(text(v.url, 2000)), summary: text(v.summary, 1500, true), at, sessionId: v.sessionId as SessionId };
  });
  unique(visits.map(v => v.id)); const ids = new Set(visits.map(v => v.id));
  const reference = (value: unknown) => { const key = id(value); if (!ids.has(key)) throw new Error('A reference points to a missing visit.'); return key; };
  const edges: Edge[] = list(root.edges, 1500).map(raw => {
    const e = object(raw);
    if (e.kind !== 'confirmed' && e.kind !== 'suggested') throw new Error('Invalid edge kind.');
    const source = reference(e.source), target = reference(e.target);
    if (source === target) throw new Error('Self edges are not supported.');
    return { id: id(e.id), source, target, kind: e.kind };
  });
  unique(edges.map(e => e.id));
  const trails: Trail[] = list(root.trails, 100).map(raw => {
    const t = object(raw); const visitIds = list(t.visitIds, 500).map(reference); unique(visitIds);
    if (!visitIds.length) throw new Error('Saved trails must contain a visit.');
    return { id: id(t.id), name: text(t.name, 100), visitIds };
  });
  unique(trails.map(t => t.id));
  const notes = Object.fromEntries(Object.entries(object(root.notes)).map(([key, value]) => [reference(key), text(value, 4000, true)]));
  const excludedDomains = list(root.excludedDomains, 100).map(raw => {
    const d = text(raw, 253).toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(d) || new URL(`https://${d}`).hostname !== d) throw new Error('Invalid excluded domain.');
    return d;
  });
  unique(excludedDomains);
  if (visits.some(v => excludedDomains.includes(domainOf(v)))) throw new Error('File contains visits for an excluded domain.');
  return { version: 1, visits, edges, trails, notes, excludedDomains };
}
export function parseImport(raw: string): State {
  if (new TextEncoder().encode(raw).byteLength > 2_000_000) throw new Error('File is too large (2 MB maximum).');
  return validateState(JSON.parse(raw));
}
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export function loadState(storage: StorageLike, fallback: () => State): { state: State; warning: string } {
  try { const raw = storage.getItem(STORAGE_KEY); return { state: raw ? parseImport(raw) : fallback(), warning: '' }; }
  catch { return { state: fallback(), warning: 'Saved data could not be read. Showing a fresh demo; the original storage has not been changed.' }; }
}
export function persistState(storage: StorageLike, state: State): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(validateState(state))); return true; } catch { return false; }
}
