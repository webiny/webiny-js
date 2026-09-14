import { findFreePort, isPortFree } from "../findFreePort.js";
import { readRememberedPort, rememberPort } from "./portMemory.js";
import { API_PREFIX, APP_PORT_BASE, DEFAULT_PROXY_PORT } from "./constants.js";

export interface IDevServerSession {
    /** The one port a developer types. api and admin sit behind it on ports nobody sees. */
    port: number;
    /** The proxy's origin, e.g. `http://localhost:3001`. */
    url: string;
    /** Where the api answers through the proxy, e.g. `http://localhost:3001/api`. */
    apiUrl: string;
    /** Where the proxy forwards to. */
    targets: { apiPort: number; adminPort: number };
}

export interface IPrepareDevServerSessionParams {
    /** Apps in this session. One app already has one URL, so a proxy only earns its keep from two. */
    apps: string[];
    /** Explicit opt-out, e.g. the CLI's `--no-proxy`. */
    enabled?: boolean;
    /**
     * Whether to point the apps at the proxy, not just reserve its ports. True for `watch`, which
     * rebuilds both apps in this process and so can still influence what they're built with. False
     * for `serve`, which runs what `webiny build` already produced: the admin bundle's API URL was
     * fixed then, and nothing set now can change it.
     */
    pointAppsAtProxy?: boolean;
    /** Project root, used to remember the port. Defaults to the working directory. */
    rootFolder?: string;
}

/**
 * Reserves the ports for a watch/serve session and points the apps at each other, so the developer
 * ends up with a single URL instead of one per app.
 *
 * Called from the command handler, which is early enough despite webiny.config having been evaluated
 * before the handler ran. The config is rendered once per distinct render args, and the app-scoped
 * renders (`{ app: "api" }`, `{ app: "admin" }`) happen inside `projectSdk.watch()` — after this. So
 * `<Infra.ApiUrl>`'s build param still picks up `WEBINY_API_URL` from here.
 *
 * `<Admin.ApiUrl>` is different: it emits an env var, and `applyEnvVars` already wrote it during the
 * bootstrap render. So the admin URLs are OVERWRITTEN rather than filled in. That's the same thing
 * AWS does in `SetAdminEnvVarsBeforeWatch`, where the real URL only becomes knowable at watch time
 * from stack output. When the proxy is on, it owns these URLs; `--no-proxy` is the way out.
 *
 * The ports are reserved here rather than left to each app because the proxy has to know where to
 * forward before anything starts, and because both apps auto-advance off a busy port on their own,
 * which is fine in isolation and silently wrong once something is pointed at them.
 *
 * Returns null when no proxy should run, in which case nothing is changed and both apps keep their
 * existing standalone behaviour.
 */
export async function prepareDevServerSession(
    params: IPrepareDevServerSessionParams
): Promise<IDevServerSession | null> {
    const { apps, enabled, pointAppsAtProxy = false, rootFolder = process.cwd() } = params;

    if (enabled === false || process.env.WEBINY_PROXY === "off" || apps.length < 2) {
        return null;
    }

    const port = await resolveProxyPort(rootFolder);

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

    if (pointAppsAtProxy) {
        // Relative on purpose. The admin bundle resolves it against the page origin at runtime, so
        // the same build works on localhost, on a portless domain like https://wby6.localhost, and
        // behind a real reverse proxy — without knowing any of them at build time.
        process.env.WEBINY_ADMIN_API_URL = API_PREFIX;

        // The websocket URL too. The admin would otherwise derive it from the API URL and land in the
        // right place anyway, but only when nothing else sets it: `<Admin.WebsocketsUrl>` takes
        // priority when present, and a project that pins it to a port (the obvious thing to write)
        // would point the socket somewhere the proxy isn't.
        process.env.WEBINY_ADMIN_WS_API_URL = API_PREFIX;

        // The api can't be relative: it hands out absolute URLs (file srcPrefix, the upload endpoint)
        // to clients that have no page origin to resolve against. Unlike the two above this one is
        // still unset at this point — `<Infra.ApiUrl>` emits a build param, not an env var — and the
        // api-scoped config render that turns it into that build param happens later, inside
        // `projectSdk.watch()`.
        process.env.WEBINY_API_URL = apiUrl;
    }

    rememberPort(rootFolder, port);

    return {
        port,
        url,
        apiUrl,
        targets: { apiPort: Number(apiPort), adminPort: Number(adminPort) }
    };
}

/**
 * An explicitly requested port is used as-is: a developer who set it, or a tool like portless that
 * injected it, has something else pointed at that exact number already. Otherwise prefer the port
 * this project used last time, and only scan when that's taken.
 */
async function resolveProxyPort(rootFolder: string): Promise<number> {
    const explicit = process.env.WEBINY_PORT || process.env.PORT;
    if (explicit) {
        return Number(explicit);
    }

    const remembered = readRememberedPort(rootFolder);
    if (remembered && (await isPortFree(remembered))) {
        return remembered;
    }

    return findFreePort(DEFAULT_PROXY_PORT);
}
