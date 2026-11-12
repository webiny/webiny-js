/**
 * Composition-root bootstrap: works out the API, GraphQL and WebSocket URLs that
 * `createRootContainer` seeds `EnvConfig` with.
 *
 * Plain functions rather than a feature on purpose. `EnvConfig` IS the abstraction here, and
 * everything downstream injects it (`WebinySdk`, `MainGraphQLClient`, `WcpService`, ...). These run
 * one step earlier, to produce the values that configure it, so a container is not yet available to
 * resolve them from. That's also why this is one of the few places allowed to read `process.env`
 * directly, alongside the other env reads sitting inline in `createRootContainer`.
 */

/**
 * Resolves a configured API URL to an absolute one against the page origin, so the value baked into
 * the bundle can be relative.
 *
 * That's what lets one build run anywhere. `WEBINY_ADMIN_API_URL=/api` works on http://localhost:3001
 * behind the dev proxy, on a portless domain like https://wby6.localhost, and behind a reverse proxy
 * in production, because the origin is filled in by the browser rather than at build time. An absolute
 * value still passes through unchanged.
 */
const toAbsoluteUrl = (url: string): string => {
    if (typeof window === "undefined") {
        return url;
    }

    // `new URL` appends a trailing slash to a bare origin; callers append their own path segments.
    return new URL(url, window.location.origin).toString().replace(/\/+$/, "");
};

// Prefer the configured API URL (baked by `<Admin.ApiUrl>` into WEBINY_ADMIN_API_URL); else
// same-origin (a deployed standalone admin served behind the same domain as the API needs no
// baked-in URL). Never return the literal string "undefined".
export const resolveApiUrl = (): string => {
    const url = process.env.WEBINY_ADMIN_API_URL;
    if (url && url !== "undefined") {
        return toAbsoluteUrl(url);
    }
    return typeof window !== "undefined" ? window.location.origin : "";
};

// The GraphQL endpoint derived from the resolved API URL.
export const resolveGraphqlUrl = (): string => `${resolveApiUrl()}/graphql`;

/*
 * The one path a standalone API takes WebSocket upgrades on. Same value as `WEBSOCKETS_PATH` in
 * @webiny/api-websockets-standalone, which an admin package can't import.
 */
const STANDALONE_WEBSOCKETS_PATH = "/ws";

/*
 * Resolve the WebSocket URL for the admin, in order:
 *   1. REACT_APP_WEBSOCKET_URL   — AWS: the dedicated API Gateway WebSocket URL.
 *   2. WEBINY_ADMIN_WS_API_URL   — standalone: the full socket URL (baked via `<Admin.WebsocketsUrl>`),
 *                                  only needed when WS is served from somewhere the default can't
 *                                  derive, like a different origin or a proxy that rewrites the path.
 *   3. derived from the API URL  — standalone default: the server handles WS upgrades on its own
 *                                  origin, so use the API URL with http(s) swapped for ws(s) and the
 *                                  `/ws` path appended.
 * The two configured values are used as is, so both name the socket itself. Returns "" when none
 * is configured (real-time updates are then disabled). This is one of the few spots allowed to read
 * process.env — it runs at the admin composition root, like resolveApiUrl.
 */
export const resolveWebsocketUrl = (): string => {
    const awsExplicit = process.env.REACT_APP_WEBSOCKET_URL;
    if (awsExplicit && awsExplicit !== "undefined") {
        return awsExplicit;
    }

    const serverExplicit = process.env.WEBINY_ADMIN_WS_API_URL;
    if (serverExplicit && serverExplicit !== "undefined") {
        return toWebsocketUrl(serverExplicit);
    }

    const apiUrl = process.env.WEBINY_ADMIN_API_URL;
    if (apiUrl && apiUrl !== "undefined") {
        return `${toWebsocketUrl(apiUrl)}${STANDALONE_WEBSOCKETS_PATH}`;
    }

    return "";
};

/**
 * Turns a configured value into a WebSocket URL the browser can dial.
 *
 * Resolved against the page origin before the scheme is swapped, because a relative value like
 * `/api` has no scheme to swap: the prefix replacement alone would hand back `/api` unchanged, which
 * connects to nothing. A value that already names a ws(s) URL keeps its scheme. Either way a
 * trailing slash goes, so the `/ws` appended to a derived URL doesn't become `//ws`.
 */
const toWebsocketUrl = (url: string): string => {
    if (/^wss?:\/\//.test(url)) {
        return url.replace(/\/+$/, "");
    }

    return toAbsoluteUrl(url).replace(/^http/, "ws");
};
