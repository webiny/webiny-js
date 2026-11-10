import { type IDevProxyUrls } from "./types.js";

/**
 * Tells the api the URLs it is reached on through the proxy.
 *
 * Both `watch` and `serve` call this. Unlike the admin bundle's API URL, these are read by the api
 * when it starts, so they can be set for a build that already exists. Without it, `serve` started the
 * api with whatever `<Infra.ApiUrl>` and `<Infra.AdminUrl>` defaulted to (a port nothing listens on
 * behind the proxy), and every file URL and upload URL it handed out was dead.
 *
 * Overwritten rather than filled in: both extensions emit env vars, and `applyEnvVars` wrote them
 * during the bootstrap config render, so filling blanks would never win. While the proxy is on it
 * owns these URLs; `--no-proxy` is the way out.
 */
export function pointApiAtDevProxy(urls: IDevProxyUrls): void {
    // Absolute, unlike the admin's: the api hands out URLs (file srcPrefix, the upload endpoint) to
    // clients that have no page origin to resolve a relative one against.
    process.env.WEBINY_API_URL = urls.apiUrl;

    // The api hands the Admin origin to clients (e.g. the starter-kit configs). The admin app is
    // served from the proxy's root.
    process.env.WEBINY_ADMIN_URL = urls.url;
}
