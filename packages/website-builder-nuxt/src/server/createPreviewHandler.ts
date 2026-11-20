import type { H3Event } from "h3";
import { DEFAULT_PREVIEW_COOKIE } from "./defaults.js";

export interface PreviewHandlerOptions {
    /** Name of the cookie that marks preview mode. Defaults to `__wb_preview`. */
    previewCookieName?: string;
}

/**
 * `//host` and `/\host` send the browser to another origin. So does `/<tab>/host`: browsers
 * strip tabs and newlines from a URL before parsing it, which turns it into `//host`.
 */
function isSameSitePath(path: string): boolean {
    // eslint-disable-next-line no-control-regex
    const hasControlCharacter = /[\u0000-\u001f\u007f]/.test(path);
    if (hasControlCharacter) {
        return false;
    }
    return /^\/(?![/\\])/.test(path);
}

/**
 * Turns preview mode on by setting the preview cookie, then redirects to the page in
 * `wb.path`, keeping every query parameter. The Nuxt counterpart of the Next.js draft-mode route.
 */
export function createPreviewHandler(options: PreviewHandlerOptions = {}) {
    const previewCookie = options.previewCookieName ?? DEFAULT_PREVIEW_COOKIE;

    return async function previewHandler(event: H3Event) {
        const h3 = await import("h3");

        const { searchParams } = h3.getRequestURL(event);
        const requestedPath = searchParams.get("wb.path") || "/";
        const targetPath = isSameSitePath(requestedPath) ? requestedPath : "/";

        // SameSite=None; Secure so the cookie is sent inside the admin's cross-origin iframe.
        h3.setCookie(event, previewCookie, "1", { path: "/", sameSite: "none", secure: true });

        const query = searchParams.toString();
        const location = `${targetPath}?${query}`;
        return h3.sendRedirect(event, location, 307);
    };
}
