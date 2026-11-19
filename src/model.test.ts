import { describe, expect, it } from 'vitest';
import { createSeed } from './seed';
import { deleteDomain, domainOf, loadState, parseImport, persistState, sanitizeUrl, searchVisits, STORAGE_KEY, validateState, visibleEdges } from './model';
import type { State } from './model';

const changed = (fn: (s: State) => void) => { const s = createSeed(); fn(s); return s; };
describe('synthetic fixture and graph', () => {
 it('contains 24 valid synthetic visits across three sessions', () => {
   const seed = createSeed(); expect(seed.visits).toHaveLength(24);
   expect(new Set(seed.visits.map(v => v.sessionId)).size).toBe(3);
   expect(validateState(seed)).toEqual(seed);
 });
 it('keeps confirmed events distinct from proximity suggestions', () => {
   const edges = createSeed().edges;
   expect(edges.some(e => e.kind === 'confirmed')).toBe(true);
   expect(edges.some(e => e.kind === 'suggested')).toBe(true);
 });
 it('returns only edges with both endpoints in the filtered graph', () => {
   const s = createSeed(); const subset = s.visits.slice(0,2);
   expect(visibleEdges(s.edges, subset)).toEqual([s.edges[0]]);
   expect(visibleEdges(s.edges, [])).toEqual([]);
 });
});
describe('keyword search', () => {
 const visits = createSeed().visits;
 it('matches case-insensitive title, URL, and description terms', () => {
   expect(searchVisits(visits, 'FTS5').map(v => v.id)).toContain('database-2');
   expect(searchVisits(visits, 'sqlite.org')).toHaveLength(4);
   expect(searchVisits(visits, 'durable')).toHaveLength(2);
 });
 it('requires every term and handles blank queries', () => {
   expect(searchVisits(visits,' SQLite    FTS5 ')).toHaveLength(1);
   expect(searchVisits(visits,'sqlite pollinators')).toHaveLength(0);
   expect(searchVisits(visits,'  ')).toHaveLength(24);
 });
});
describe('domain deletion', () => {
 it('removes visits, incoming/outgoing edges, notes, and trail references without mutating input', () => {
   const original = createSeed(); const next = deleteDomain(original,'www.sqlite.org');
   expect(original.visits).toHaveLength(24);
   expect(next.visits).toHaveLength(20);
   expect(next.visits.some(v => domainOf(v) === 'www.sqlite.org')).toBe(false);
   expect(next.notes['database-2']).toBeUndefined();
   const deleted = new Set(['database-1','database-2','database-3','database-8']);
   expect(next.edges.every(e => !deleted.has(e.source) && !deleted.has(e.target))).toBe(true);
   expect(next.trails.every(t => t.visitIds.every(id => !deleted.has(id)))).toBe(true);
   expect(next.excludedDomains).toContain('www.sqlite.org');
   expect(validateState(next)).toEqual(next);
 });
 it('removes empty trails and deduplicates exclusions', () => {
   const s = changed(s => { s.trails = [{id:'only',name:'Only SQLite',visitIds:['database-2']}]; });
   const next = deleteDomain(deleteDomain(s,'www.sqlite.org'),'www.sqlite.org');
   expect(next.trails).toEqual([]); expect(next.excludedDomains).toEqual(['www.sqlite.org']);
 });
 it('matches exact hosts, not arbitrary substrings or child domains', () => {
   expect(deleteDomain(createSeed(),'sqlite.org').visits).toHaveLength(24);
 });
});
describe('safe URLs and strict imports', () => {
 it('strips credentials, query strings, and fragments', () => {
   expect(sanitizeUrl('https://user:secret@EXAMPLE.com/path?token=private#section')).toBe('https://example.com/path');
 });
 it.each(['javascript:alert(1)','file:///etc/passwd','data:text/html,hi','not a url','ftp://example.com'])('rejects non-web URL %s', url => { expect(() => sanitizeUrl(url)).toThrow(); });
 it('sanitizes URLs during import and strips unrecognized fields', () => {
   const s = changed(s => { s.visits[0].url = 'https://user:pass@example.com/article?q=secret#fragment'; });
   const parsed = parseImport(JSON.stringify({...s, tracker:'ignore'}));
   expect(parsed.visits[0].url).toBe('https://example.com/article');
   expect(parsed).not.toHaveProperty('tracker');
 });
 it.each([
   (s: State) => { s.edges[0].source = 'missing'; },
   (s: State) => { s.trails[0].visitIds.push('missing'); },
   (s: State) => { s.notes.missing = 'orphan'; },
   (s: State) => { s.visits[0].id = s.visits[1].id; },
   (s: State) => { s.edges[0].id = s.edges[1].id; },
   (s: State) => { s.trails[0].id = s.trails[1].id; },
   (s: State) => { s.visits[0].id = '__proto__'; },
   (s: State) => { s.visits[0].sessionId = 'unknown' as never; },
   (s: State) => { s.edges[0].kind = 'inferred-fact' as never; },
   (s: State) => { s.edges[0].target = s.edges[0].source; },
   (s: State) => { s.visits[0].at = '2026-02-30T10:00:00Z'; },
   (s: State) => { s.visits[0].at = 'today'; },
   (s: State) => { s.trails[0].visitIds = []; },
   (s: State) => { s.notes['database-0'] = 'x'.repeat(4001); },
   (s: State) => { s.excludedDomains = ['www.sqlite.org']; },
   (s: State) => { s.excludedDomains = ['evil.com/path']; },
 ])('rejects malformed records and dangling references %#', mutate => { expect(() => validateState(changed(mutate))).toThrow(); });
 it('rejects unsupported versions, malformed JSON, oversized inputs and too many records', () => {
   expect(() => parseImport('{')).toThrow();
   expect(() => validateState({...createSeed(),version:2})).toThrow();
   expect(() => parseImport(' '.repeat(2_000_001))).toThrow('too large');
   expect(() => validateState({...createSeed(),visits:Array(501).fill(createSeed().visits[0])})).toThrow();
 });
 it('keeps markup as plain text without interpreting it', () => {
   const s = changed(s => { s.visits[0].title='<img src=x onerror=alert(1)>'; s.notes['database-0']='<script>alert(1)</script>'; });
   expect(validateState(s).notes['database-0']).toBe('<script>alert(1)</script>');
 });
});
describe('local persistence', () => {
 function memory() { const data = new Map<string,string>(); return { getItem: (key:string) => data.get(key) ?? null, setItem: (key:string,value:string) => { data.set(key,value); } }; }
 it('round trips visits, notes, saved trails and exclusions', () => {
   const storage=memory(); const s = deleteDomain(createSeed(),'www.sqlite.org');
   expect(persistState(storage,s)).toBe(true);
   expect(loadState(storage,createSeed)).toEqual({state:s,warning:''});
 });
 it('loads sample data only when no valid saved workspace exists', () => {
   const storage=memory(); expect(loadState(storage,createSeed).state.visits).toHaveLength(24);
   const empty: State={version:1,visits:[],edges:[],notes:{},trails:[],excludedDomains:[]};
   persistState(storage,empty); expect(loadState(storage,createSeed).state.visits).toEqual([]);
 });
 it('recovers read-only from malformed or invalid saved data and reports the failure', () => {
   const storage=memory(); storage.setItem(STORAGE_KEY,'bad json');
   expect(loadState(storage,createSeed).warning).not.toBe('');
   expect(storage.getItem(STORAGE_KEY)).toBe('bad json');
   storage.setItem(STORAGE_KEY,JSON.stringify(changed(s => { s.edges[0].target='missing'; })));
   expect(loadState(storage,createSeed).state.visits).toHaveLength(24);
 });
 it('handles quota/access failures without throwing', () => {
   const storage={ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); } };
   expect(loadState(storage,createSeed).warning).not.toBe('');
   expect(persistState(storage,createSeed())).toBe(false);
 });
 it('refuses to persist invalid state', () => { expect(persistState(memory(),changed(s => { s.edges[0].source='missing'; }))).toBe(false); });
});
