import { API_PREFIX } from "./constants.js";
import { type IDevProxyUrls } from "./types.js";

/**
 * The URLs of the proxy this session reserved, or null when none was.
 *
 * Read back from the env `reserveDevProxyPorts` wrote, so a process that only needs the answer
 * (`spawnApiServer`, which runs in the same process but long after) gets it without being handed it.
 *
 * A tool like portless terminates TLS on a domain of its own and forwards to the port it handed us,
 * so `http://localhost:<port>` is our side of that hop rather than the address anyone opens. It
 * announces the real one in `PORTLESS_URL`, and taking it matters beyond the banner: the api bakes
 * this into the absolute URLs it hands clients (the upload endpoint, the file `srcPrefix`). Left to
 * our own URL those point back at the raw port, which works only because browsers exempt
 * `http://localhost` from mixed-content blocking, and stops working the moment the port changes.
 */
export function getDevProxyUrls(): IDevProxyUrls | null {
    const port = process.env.WEBINY_PROXY_PORT;
    if (!port) {
        return null;
    }

    const url = process.env.PORTLESS_URL || `http://localhost:${port}`;
    return { url, apiUrl: `${url}${API_PREFIX}` };
}
