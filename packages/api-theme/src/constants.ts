/**
 * Key under which the tenant's active theme pointer is stored in the tenant-scoped KeyValueStore.
 * Activation writes it; the delivery endpoint and the SDK read it.
 */
export const ACTIVE_THEME_KEY = "Theme/Active";

/**
 * Delivery paths — see the design brief, section 6.3.
 *
 * These are served through the frontend app's own origin via a rewrite, not straight off a Webiny
 * API domain, so a render-blocking stylesheet does not cost a DNS lookup and TLS handshake on a
 * cold visit.
 */
export const THEME_ARTIFACT_ROUTE = "/_webiny/theme/:themeId/:version/:file";
export const ACTIVE_THEME_ROUTE = "/_webiny/theme/active";

/** A published version never changes, so its artifacts can be cached indefinitely. */
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * The active pointer moves on activation, so it is short-cached rather than immutable. Activation
 * fires a webhook for consumers that want to invalidate sooner; this TTL is the floor for those
 * that do not.
 */
export const ACTIVE_THEME_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

/** A draft is rendered on demand and must never be cached. */
export const NO_CACHE_CONTROL = "no-store";

/** CMS revision ids are `<entryId>#<zero-padded version>`. */
export const toRevisionId = (entryId: string, version: number): string => {
    return `${entryId}#${String(version).padStart(4, "0")}`;
};
