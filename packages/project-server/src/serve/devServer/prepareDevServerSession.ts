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
    /** Raw process arguments, used to work out whether this command wants a proxy at all. */
    argv: string[];
    /** Project root, used to remember the port. Defaults to the working directory. */
    rootFolder?: string;
}

let currentSession: IDevServerSession | null | undefined;

/**
 * Reserves the ports for a watch/serve session and points the apps at each other, so the developer
 * ends up with a single URL instead of one per app.
 *
 * MUST run before the CLI container is built, which is why the CLI bin calls it rather than the watch
 * or serve command. The container resolves the project SDK while it is being constructed (to pick up
 * `<Cli.Command>` extensions), and that evaluates webiny.config and applies its env vars. By the time
 * a command handler runs, `<Admin.ApiUrl>` and `<Infra.ApiUrl>` have already been read and baked, so
 * anything set there is too late to be seen. Same constraint as WEBINY_HOSTING_TYPE, set alongside
 * this in the bin.
 *
 * Setting rather than overriding is deliberate: `applyEnvVars` only fills env vars that are still
 * blank, so writing them first is what gives the proxy priority over the config without having to
 * overrule a URL somebody set on purpose.
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
    const { argv, rootFolder = process.cwd() } = params;

    if (!wantsDevProxy(argv)) {
        currentSession = null;
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

    // The websocket URL too, for the same reason and by the same rule. The admin would otherwise
    // derive it from the API URL and land in the right place anyway, but only when nothing else sets
    // it: `<Admin.WebsocketsUrl>` takes priority when present, and a project that pins it to a port
    // (which is the obvious thing to write) would point the socket somewhere the proxy isn't.
    setIfUnset("WEBINY_ADMIN_WS_API_URL", API_PREFIX);

    // The api can't do the same: it hands out absolute URLs (file srcPrefix, the upload endpoint) to
    // clients that have no page origin to resolve against. This covers plain localhost; behind a
    // portless domain the origin is only knowable per request, which is what the api's
    // `x-forwarded-*` fallback handles.
    setIfUnset("WEBINY_API_URL", apiUrl);

    rememberPort(rootFolder, port);

    currentSession = { port, url, apiUrl };
    return currentSession;
}

/**
 * The session prepared for this process, or null when no proxy is running.
 *
 * Module state because of the timing above: the decision and the port reservation happen in the bin,
 * before the container that holds the command handlers exists, so there is nothing to hand the result
 * to. The handlers read it back here when they're ready to start the proxy.
 */
export function getDevServerSession(): IDevServerSession | null {
    return currentSession ?? null;
}

/**
 * Whether this invocation is one the proxy belongs in front of: `watch` or `serve` with no single app
 * named, since one app already has one URL.
 *
 * Read straight off argv because this runs before anything has parsed it. Deliberately conservative,
 * so an argument shape not accounted for here falls through to the existing separate-ports behaviour
 * rather than to a half-configured proxy.
 */
export function wantsDevProxy(argv: string[]): boolean {
    if (process.env.WEBINY_PROXY === "off" || argv.includes("--no-proxy")) {
        return false;
    }

    // Everything before the first flag. yargs puts the command first, then its positional arguments.
    const positional: string[] = [];
    for (const arg of argv) {
        if (arg.startsWith("-")) {
            break;
        }
        positional.push(arg);
    }

    if (positional[0] !== "watch" && positional[0] !== "serve") {
        return false;
    }

    // `watch api` / `serve admin`: one app, one URL already.
    return positional.length === 1;
}

/**
 * Reads back where the apps actually ended up. Called when the proxy starts rather than reusing the
 * values above, because `.env.<env>` is loaded during SDK init with `override: true` and can move them.
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
