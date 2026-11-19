import type { State, SessionId, Visit, Edge } from './model';
const rows: Record<SessionId, [string, string, string][]> = {
 database: [
  ['Local-first software', 'https://www.inkandswitch.com/local-first/', 'The software you use should keep working offline, and your data should remain yours. A starting point for this research trail.'],
  ['SQLite is not a toy database', 'https://www.sqlite.org/whentouse.html', 'An embedded database makes a surprisingly good foundation for personal tools. No server to maintain, just a portable file.'],
  ['The FTS5 extension', 'https://www.sqlite.org/fts5.html', 'Full-text indexing, prefix queries, and ranked results. A lightweight way to make a local collection searchable.'],
  ['How SQLite query planning works', 'https://www.sqlite.org/queryplanner.html', 'Indexes help narrow a search without scanning the whole table. Look at the query plan before adding more machinery.'],
  ['A small guide to inverted indexes', 'https://en.wikipedia.org/wiki/Inverted_index', 'Map words back to the documents that contain them. Sometimes the simplest useful data structure is enough.'],
  ['Designing for offline', 'https://web.dev/learn/pwa/offline-data', 'Think about durable storage, recovery, and the difference between a cache and the source of truth.'],
  ['Chrome native messaging', 'https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging', 'A browser extension can communicate with a registered local host. A potential bridge to an on-device SQLite index.'],
  ['Small, sharp software tools', 'https://www.inkandswitch.com/essay/', 'A reminder to start with a complete, small experience instead of a platform. Capture a trail, explain a link, find your way back.'],
  ['SQLite application file format', 'https://www.sqlite.org/appfileformat.html', 'A single-file application format can make personal data easier to back up, move, and inspect.'],
 ],
 maps: [
  ['An open map of the world', 'https://www.openstreetmap.org/about', 'An open, community-built map. Start with the people and data behind the places we navigate.'],
  ['The art of map projections', 'https://en.wikipedia.org/wiki/Map_projection', 'Every flat map makes a trade-off. Shape, area, direction: decide what the map needs to preserve.'],
  ['A guide to GeoJSON', 'https://geojson.org/', 'A simple interchange format for points, lines, and polygons. A useful common language for a trail map.'],
  ['Making maps with MapLibre', 'https://maplibre.org/', 'Open-source tools for rendering interactive maps. A direction to explore for a personal walking atlas.'],
  ['The hidden stories of contour lines', 'https://en.wikipedia.org/wiki/Contour_line', 'Read the landscape before setting out. Closely spaced contours often reveal a much steeper walk.'],
  ['Leave no trace principles', 'https://lnt.org/why/7-principles/', 'Plan ahead, stay on durable surfaces, and leave places as you found them. An essential part of any trail plan.'],
  ['A field guide to open data', 'https://www.usgs.gov/programs/national-geospatial-program', 'Public geographic datasets can add terrain and context to a map. Check coverage and licensing.'],
  ['The joy of taking the long way', 'https://en.wikipedia.org/wiki/Walking', 'A good route is not always the shortest route. Leave room for discovery and a little wandering.'],
 ],
 garden: [
  ['Start a balcony garden', 'https://www.rhs.org.uk/garden-design/balcony-gardening', 'Begin with sunlight, wind, and the weight your balcony can safely support. A small space is still a place to grow.'],
  ['Find your native plants', 'https://www.calscape.org/', 'Choose plants suited to the local climate and habitat. Native species can support the insects and birds around you.'],
  ['Container gardening basics', 'https://extension.umn.edu/planting-and-growing-guides/container-gardening', 'Drainage, potting mix, and container size matter more than a perfect-looking pot. Start with something manageable.'],
  ['A little home for pollinators', 'https://xerces.org/pollinator-conservation', 'A sequence of flowering plants can offer food throughout the season, even in a modest urban space.'],
  ['Understanding soil moisture', 'https://en.wikipedia.org/wiki/Soil_moisture', 'Water according to the soil and the plant, not only the calendar. Containers may dry at very different rates.'],
  ['Growing herbs in containers', 'https://www.rhs.org.uk/herbs/growing', 'Herbs bring a useful, fragrant daily ritual to a small garden. Group plants with similar water needs.'],
  ['A season of small observations', 'https://www.inaturalist.org/', 'Notice what visits your garden. A few quiet observations can turn a small planting into a living notebook.'],
 ],
};
export function createSeed(): State {
 const visits: Visit[] = []; const edges: Edge[] = [];
 Object.entries(rows).forEach(([session, entries], si) => entries.forEach(([title, url, summary], i) => {
   const id = `${session}-${i}`;
   visits.push({ id, title, url, summary, sessionId: session as SessionId, at: new Date(Date.UTC(2026,10,17-si,17,10+i*7)).toISOString() });
   if (i > 0) edges.push({ id: `edge-${session}-${i}`, source: `${session}-${i-1}`, target: id, kind: i === 4 || i === 7 ? 'suggested' : 'confirmed' });
 }));
 return { version: 1, visits, edges,
   trails: [ { id: 'local-foundations', name: 'Local-first foundations', visitIds: ['database-0','database-1','database-2','database-6','database-8'] }, { id: 'weekend-notes', name: 'A slower weekend', visitIds: ['maps-0','maps-5','garden-0','garden-3'] } ],
   notes: { 'database-2': 'Start with FTS5, not embeddings. Test search quality with a small real collection first.', 'garden-0': 'Check the afternoon sunlight before choosing plants.' }, excludedDomains: [] };
}
