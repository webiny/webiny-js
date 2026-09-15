import { findFreePort } from "../findFreePort.js";
import { API_PREFIX, APP_PORT_BASE, DEFAULT_PROXY_PORT } from "./constants.js";

export interface IDevProxySession {
    /** The one port a developer types. api and admin sit behind it on ports nobody sees. */
    port: number;
    /** The proxy's origin, e.g. `http://localhost:3001`. */
    url: string;
    /** Where the api answers through the proxy, e.g. `http://localhost:3001/api`. */
    apiUrl: string;
    /** Where the proxy forwards to. */
    targets: { apiPort: number; adminPort: number };
}

export interface IPrepareDevProxySessionParams {
    /** Apps in this session. One app already has one URL, so a proxy only earns its keep from two. */
    apps: string[];
    /** Explicit opt-out, e.g. the CLI's `--no-proxy`. */
    enabled?: boolean;
}

let currentSession: IDevProxySession | null = null;

/**
 * Picks the three ports a single-URL session runs on, and pins the two app ones so the proxy knows
 * where to forward.
 *
 * Pinning is the whole job. `runApiServer`, `runAdminServer` and the admin rsbuild config each
 * resolve their own port already, and each auto-advances off a busy one. That is fine when nothing
 * is pointed at them and silently wrong the moment something is, so this decides once, up front, and
 * writes the answer into the `WEBINY_API_PORT` / `WEBINY_ADMIN_PORT` those three already read.
 *
 * Returns null when no proxy should run, in which case nothing is changed at all and both apps keep
 * their existing standalone behaviour.
 */
export async function prepareDevProxySession(
    params: IPrepareDevProxySessionParams
): Promise<IDevProxySession | null> {
    const { apps, enabled } = params;

    if (enabled === false || process.env.WEBINY_PROXY === "off" || apps.length < 2) {
        currentSession = null;
        return null;
    }

    const port = await resolveProxyPort();

    // The proxy has taken over `PORT`, so remove it: both app runners fall back to it, and two
    // servers honouring the same injected port is how you get one of them silently failing to bind.
    delete process.env.PORT;

    // An explicit WEBINY_API_PORT / WEBINY_ADMIN_PORT still wins — someone who pinned a port wants
    // that port, and the proxy can forward to it just as happily.
    const apiPort = process.env.WEBINY_API_PORT || String(await findFreePort(APP_PORT_BASE));
    const adminPort =
        process.env.WEBINY_ADMIN_PORT || String(await findFreePort(Number(apiPort) + 1));

    process.env.WEBINY_API_PORT = apiPort;
    process.env.WEBINY_ADMIN_PORT = adminPort;

    const url = `http://localhost:${port}`;
    const apiUrl = `${url}${API_PREFIX}`;

    currentSession = {
        port,
        url,
        apiUrl,
        targets: { apiPort: Number(apiPort), adminPort: Number(adminPort) }
    };

    return currentSession;
}

/**
 * Tells the apps to talk to each other through the proxy rather than directly.
 *
 * Only `watch` calls this. `serve` runs what `webiny build` already produced, so the admin bundle's
 * API URL was fixed back then and nothing set now can move it.
 *
 * Call before `projectSdk.watch()`. webiny.config has already been evaluated by the time a command
 * handler runs, but it is rendered once per distinct render args, and the app-scoped renders
 * (`{ app: "api" }`, `{ app: "admin" }`) happen inside that call — after this. So `<Infra.ApiUrl>`'s
 * build param still picks up `WEBINY_API_URL` from here.
 */
export function pointAppsAtDevProxy(session: IDevProxySession): void {
    // Relative on purpose. The admin bundle resolves it against the page origin at runtime, so the
    // same build works on localhost, on a portless domain like https://wby6.localhost, and behind a
    // real reverse proxy — without knowing any of them at build time.
    //
    // Overwritten rather than filled in: `<Admin.ApiUrl>` emits an env var, and `applyEnvVars` wrote
    // it during the bootstrap config render, so filling blanks would never win. Same thing AWS does
    // in `SetAdminEnvVarsBeforeWatch`, where the real URL is only knowable at watch time from stack
    // output. While the proxy is on it owns these URLs; `--no-proxy` is the way out.
    process.env.WEBINY_ADMIN_API_URL = API_PREFIX;

    // The websocket URL too. The admin would otherwise derive it from the API URL and land in the
    // right place anyway, but only when nothing else sets it: `<Admin.WebsocketsUrl>` takes priority
    // when present, and a project that pins it to a port (the obvious thing to write) would point the
    // socket somewhere the proxy isn't.
    process.env.WEBINY_ADMIN_WS_API_URL = API_PREFIX;

    // The api can't be relative: it hands out absolute URLs (file srcPrefix, the upload endpoint) to
    // clients that have no page origin to resolve against. Unlike the two above, this one is still
    // unset here, because `<Infra.ApiUrl>` emits a build param rather than an env var.
    process.env.WEBINY_API_URL = session.apiUrl;
}

/**
 * The session prepared for this process, or null when no proxy should run.
 *
 * The CLI decides (it is the only thing that knows whether this invocation is a one-app or a
 * two-app session) and the project layer, which owns the server processes, reads the decision back
 * here when it assembles them. A module-level value rather than a parameter because the two sides
 * meet through `Watch` / `Serve`, whose params are hosting-agnostic.
 */
export function getDevProxySession(): IDevProxySession | null {
    return currentSession;
}

/**
 * An explicitly requested port is used as-is: a developer who set it, or a tool like portless that
 * injected it, has something else pointed at that exact number already. Otherwise take the first free
 * port from 3001, which gives a project the same port every time unless another one is already on it.
 */
async function resolveProxyPort(): Promise<number> {
    const explicit = process.env.WEBINY_PORT || process.env.PORT;
    if (explicit) {
        return Number(explicit);
    }

    return findFreePort(DEFAULT_PROXY_PORT);
}
