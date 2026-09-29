import { API_PREFIX } from "./constants.js";
import { type IDevProxyUrls } from "./types.js";

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
export function pointAppsAtDevProxy(urls: IDevProxyUrls): void {
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
    process.env.WEBINY_API_URL = urls.apiUrl;
}
