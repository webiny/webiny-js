/**
 * Key under which the tenant's active theme pointer is stored in the tenant-scoped KeyValueStore.
 * Activation writes it; delivery reads it.
 */
export const ACTIVE_THEME_KEY = "Theme/Active";

/**
 * The theme document's shape version, stamped on every theme at creation.
 *
 * This is the first of what will be several shape changes, so a version lets a future change detect
 * and migrate older documents. A theme without one predates the semantic-layer expansion (40 colour
 * slots, semantic radius/shadow/spacing/border, border widths, descriptions) — see the change brief.
 */
export const THEME_SCHEMA_VERSION = 1;

/**
 * Delivery paths — see the design brief, section 6.3, and the change brief, C7.
 *
 * Served through the frontend app's own origin via a rewrite, not straight off a Webiny API domain,
 * so a render-blocking stylesheet does not cost a DNS lookup and TLS handshake on a cold visit.
 *
 * The version is deliberately NOT in the path. Delivery always serves whichever version is active,
 * at a stable URL with a short TTL — so ISR-cached HTML keeps pointing at the same URL and the CDN
 * refreshes its contents within the TTL after an activation. That is what removes the need for the
 * activation webhook the frontend previously had to wire.
 */
export const THEME_ROUTE_PREFIX = "/_webiny/theme";
export const STABLE_THEME_ROUTE = `${THEME_ROUTE_PREFIX}/:file`;

/**
 * Preview is the one place a specific version is still addressable. It targets a draft (or any
 * version) explicitly, is gated behind the theme permission, and is never cached.
 */
export const THEME_PREVIEW_ROUTE = `${THEME_ROUTE_PREFIX}/preview/:themeId/:version/:file`;

/**
 * The active version moves on activation, so the stable URLs are short-cached rather than immutable.
 * This TTL is the floor on how quickly an activation reaches a running site — around a minute — and
 * is the whole eventual-consistency mechanism now that there is no webhook.
 */
export const STABLE_THEME_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

/** A draft is rendered on demand and must never be cached. */
export const NO_CACHE_CONTROL = "no-store";

/** CMS revision ids are `<entryId>#<zero-padded version>`. */
export const toRevisionId = (entryId: string, version: number): string => {
    return `${entryId}#${String(version).padStart(4, "0")}`;
};
