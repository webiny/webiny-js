/**
 * The CORS headers a response carries so that a browser on another origin can read it.
 *
 * `CorsHeadersDecorator` adds them to every response the router returns. A transport that answers
 * without the router, as the Node transport does for a body that is too large, adds them itself, or
 * the browser reports a CORS failure instead of the status the API sent.
 */
export function corsHeaders(origin: string | undefined): Record<string, string> {
    return {
        "access-control-allow-origin": origin || "*",
        "access-control-allow-credentials": "true",
        vary: "origin"
    };
}
