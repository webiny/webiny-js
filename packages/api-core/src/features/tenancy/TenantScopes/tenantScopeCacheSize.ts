/** The build param that sets how many idle tenant scopes a request keeps cached. */
export const TENANT_SCOPE_CACHE_SIZE_BUILD_PARAM = "TenantScopeCacheSize";

/** Idle tenant scopes a request keeps cached when the `TenantScopeCacheSize` build param isn't set. */
export const DEFAULT_TENANT_SCOPE_CACHE_SIZE = 10;

/**
 * How many idle tenant scopes a request keeps cached, from the `TenantScopeCacheSize` build param:
 * - a whole number from `0` up: at most that many (`0` keeps none)
 * - a negative number: no limit, idle scopes are kept until the request ends
 * - unset or not a whole number: `DEFAULT_TENANT_SCOPE_CACHE_SIZE`
 */
export const getTenantScopeCacheSize = (value: string | number | null | undefined): number => {
    const trimmed = value === null || value === undefined ? "" : String(value).trim();
    if (!/^-?\d+$/.test(trimmed)) {
        return DEFAULT_TENANT_SCOPE_CACHE_SIZE;
    }
    const size = Number(trimmed);
    return size < 0 ? Infinity : size;
};
