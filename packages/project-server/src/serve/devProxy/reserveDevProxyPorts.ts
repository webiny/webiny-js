import { findFreePort } from "../findFreePort.js";
import { API_PREFIX } from "./constants.js";
import { APP_PORT_BASE } from "./constants.js";
import { DEFAULT_PROXY_PORT } from "./constants.js";
import { type IDevProxyUrls } from "./types.js";
import { type IReserveDevProxyPortsParams } from "./types.js";

/**
 * Picks the three ports a single-URL session runs on, and pins them so nothing moves underneath.
 *
 * Pinning is the whole job. `spawnApiServer`, `spawnAdminServer` and the admin rsbuild config each
 * resolve their own port already, and each auto-advances off a busy one. That is fine when nothing
 * is pointed at them and silently wrong the moment something is, so this decides once, up front, and
 * writes the answer into the `WEBINY_API_PORT` / `WEBINY_ADMIN_PORT` those three already read.
 *
 * `WEBINY_PROXY_PORT` is the proxy's own, and doubles as the record that a proxy was reserved at all
 * (see `isDevProxyEnabled`).
 *
 * Returns null when no proxy should run, in which case nothing is changed and both apps keep their
 * existing standalone behaviour. Pointing the apps at the proxy is a separate step, because `serve`
 * wants the ports and not that: see `pointAppsAtDevProxy`.
 */
export async function reserveDevProxyPorts(
    params: IReserveDevProxyPortsParams
): Promise<IDevProxyUrls | null> {
    const { apps, enabled } = params;

    if (enabled === false || process.env.WEBINY_PROXY === "off" || apps.length < 2) {
        return null;
    }

    const port = await resolveProxyPort();

    // The proxy has taken over `PORT`, so remove it: both app runners fall back to it, and two
    // servers honouring the same injected port is how you get one of them silently failing to bind.
    delete process.env.PORT;

    // An explicit WEBINY_API_PORT / WEBINY_ADMIN_PORT still wins. Someone who pinned a port wants
    // that port, and the proxy can forward to it just as happily.
    const apiPort = process.env.WEBINY_API_PORT || String(await findFreePort(APP_PORT_BASE));
    const adminPort =
        process.env.WEBINY_ADMIN_PORT || String(await findFreePort(Number(apiPort) + 1));

    process.env.WEBINY_PROXY_PORT = String(port);
    process.env.WEBINY_API_PORT = apiPort;
    process.env.WEBINY_ADMIN_PORT = adminPort;

    return { url: publicUrl(port), apiUrl: `${publicUrl(port)}${API_PREFIX}` };
}

/**
 * Where a browser actually reaches the proxy.
 *
 * A tool like portless terminates TLS on a domain of its own and forwards to the port it handed us,
 * so `http://localhost:<port>` is our side of that hop rather than the address anyone opens. It
 * announces the real one in `PORTLESS_URL`, and taking it matters beyond the banner: the api bakes
 * this into the absolute URLs it hands clients (the upload endpoint, the file `srcPrefix`). Left to
 * our own URL those point back at the raw port, which works only because browsers exempt
 * `http://localhost` from mixed-content blocking, and stops working the moment the port changes.
 */
function publicUrl(port: number): string {
    return process.env.PORTLESS_URL || `http://localhost:${port}`;
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
