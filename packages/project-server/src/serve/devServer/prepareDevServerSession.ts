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
}

export interface IPrepareDevServerSessionParams {
    /** Apps in this session. One app already has one URL, so a proxy only earns its keep from two. */
    apps: string[];
    /** Explicit opt-out, e.g. the CLI's `--no-proxy`. */
    enabled?: boolean;
    /** Project root, used to remember the port. Defaults to the working directory. */
    rootFolder?: string;
}

/**
 * Reserves the ports for a watch/serve session and points the apps at each other, so the developer
 * ends up with a single URL instead of one per app.
 *
 * MUST be called before the project SDK is initialized. Two things depend on that ordering:
 * `applyEnvVars` only fills env vars that are still blank, so the values written here take precedence
 * over `<Admin.ApiUrl>` / `<Infra.ApiUrl>` in webiny.config; and the project config is evaluated
 * during SDK init, which is when a config reading `process.env.WEBINY_API_URL` reads it.
 *
 * The ports are reserved here rather than left to each app because the proxy has to know where to
 * forward before anything starts, and because both apps auto-advance off a busy port on their own —
 * fine in isolation, silently wrong once something is pointed at them.
 *
 * Returns null when no proxy should run, in which case nothing is changed and both apps keep their
 * existing standalone behaviour.
 */
export async function prepareDevServerSession(
    params: IPrepareDevServerSessionParams
): Promise<IDevServerSession | null> {
    const { apps, enabled, rootFolder = process.cwd() } = params;

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

    // Relative on purpose. The admin bundle resolves it against the page origin at runtime, so the
    // same build works on localhost, on a portless domain like https://wby6.localhost, and behind a
    // real reverse proxy in production — without knowing any of them at build time.
    setIfUnset("WEBINY_ADMIN_API_URL", API_PREFIX);

    // The api can't do the same: it hands out absolute URLs (file srcPrefix, the upload endpoint) to
    // clients that have no page origin to resolve against. This covers plain localhost; behind a
    // portless domain the origin is only knowable per request, which is what the api's
    // `x-forwarded-*` fallback handles.
    setIfUnset("WEBINY_API_URL", apiUrl);

    rememberPort(rootFolder, port);

    return { port, url, apiUrl };
}

/**
 * Reads back where the apps actually ended up. Called after SDK init rather than reusing the values
 * above, because `.env.<env>` is loaded during init with `override: true` and can move them.
 */
export function readDevServerTargets(): { apiPort: number; adminPort: number } {
    return {
        apiPort: Number(process.env.WEBINY_API_PORT),
        adminPort: Number(process.env.WEBINY_ADMIN_PORT)
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

function setIfUnset(name: string, value: string) {
    if (!process.env[name]) {
        process.env[name] = value;
    }
}
