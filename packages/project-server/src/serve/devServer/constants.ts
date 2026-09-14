/**
 * Path prefix the dev proxy routes to the api; everything else goes to admin. Fixed rather than
 * configurable, because the value has to agree in four places at once — the proxy's routing, the API
 * URL baked into the admin bundle, the api's own public origin, and the `x-forwarded-prefix` the api
 * rebuilds absolute URLs from. Nothing so far has needed it to differ per project.
 */
export const API_PREFIX = "/api";

/**
 * Where the proxy starts looking for a port. 3001 is the port the admin dev server used to bind, so
 * it's what muscle memory and existing bookmarks already point at. A second project running at the
 * same time lands on 3002, a third on 3003, and so on.
 */
export const DEFAULT_PROXY_PORT = 3001;

/**
 * Where api and admin start looking. Deliberately high: with a proxy in front, their ports are an
 * implementation detail nobody types, and keeping them out of the 3000s means they can't squat on the
 * port another project's proxy wants. That squatting is the actual bug this whole thing fixes.
 */
export const APP_PORT_BASE = 41000;

/** Where the proxy port is remembered between runs, relative to the project root. */
export const PORT_MEMORY_FILE = ".webiny/dev-server.json";
