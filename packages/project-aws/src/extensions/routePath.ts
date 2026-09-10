/**
 * The `path` prop on `<Api.Route>` feeds two consumers that spell path parameters differently:
 * API Gateway wants `{orderId}`, the DI `HttpRouter` wants `:orderId`. Rather than pick a winner and
 * break whichever projects already used the other, accept both and convert per consumer.
 *
 * Wildcards are left alone. `HttpRouter` matches a trailing `/*`, API Gateway spells the same thing
 * `{proxy+}`, and translating between them changes what the route captures — so a wildcard route
 * has to be written for the target it's aimed at.
 */

/** `/orders/:orderId` → `/orders/{orderId}`. Already-braced segments pass through. */
export function toApiGatewayPath(path: string): string {
    return path.replace(/(^|\/):([^/]+)/g, (_match, prefix: string, name: string) => {
        return `${prefix}{${name}}`;
    });
}

/** `/orders/{orderId}` → `/orders/:orderId`. Already-colon segments pass through. */
export function toRouterPath(path: string): string {
    return path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
        return `:${name}`;
    });
}

/**
 * `/asd/{id}/xs` + POST → `asd-xs-post`. Handles either parameter syntax.
 *
 * Used for BOTH the Pulumi resource name and the route's DI name, so the name a decorator matches
 * on is the same one that shows up in infrastructure.
 */
export function deriveRouteName(routePath: string, method: string): string {
    // /asd/{id}/xs + POST → asd-xs-post. Strips parameters in either syntax.
    const pathPart = routePath
        .replace(/^\//, "")
        .replace(/\{[^}]*\}/g, "")
        .replace(/(^|\/):[^/]+/g, "$1")
        .replace(/\/+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return `${pathPart}-${method.toLowerCase()}`;
}
