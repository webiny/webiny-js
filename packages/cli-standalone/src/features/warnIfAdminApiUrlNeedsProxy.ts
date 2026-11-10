import { type UiService } from "@webiny/cli-core/abstractions/index.js";

/**
 * Warns when the admin runs without the proxy but its API URL is a path.
 *
 * A path such as `/api` (the standalone config's default when WEBINY_API_URL is unset) resolves
 * against the admin's own origin. Behind the proxy that is where the api answers; on its own port
 * nothing does, and the admin fails on its first request without saying why.
 *
 * `WEBINY_ADMIN_API_URL` is what `<Admin.ApiUrl>` set during this run's config render. For `watch`
 * that is what the admin is built with. For `serve` the bundle was built earlier, so this is a
 * guess that the build ran with the same env, which is why it warns rather than stops.
 */
export function warnIfAdminApiUrlNeedsProxy(ui: UiService.Interface): void {
    const adminApiUrl = process.env.WEBINY_ADMIN_API_URL;
    if (!adminApiUrl?.startsWith("/")) {
        return;
    }

    ui.warning(
        `The Admin's API URL is %s, a path on the Admin's own origin, and the Admin is running without the proxy, so nothing answers there. Set %s (and rebuild the Admin for %s), or run with the proxy.`,
        adminApiUrl,
        "WEBINY_API_URL",
        "serve"
    );
}
