import { HttpRoute, HttpRouteDefinition, RequestContainer } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import { ActiveRedirectRestMapper } from "./ActiveRedirectRestMapper.js";
import { createAbstraction } from "@webiny/feature/api";

class WebsiteBuilderRedirectsRouteImpl implements HttpRoute.Interface {
    constructor(private container: Container) {}

    async handle(_request: HttpRoute.Request, response: HttpRoute.Response) {
        // Resolve collaborators lazily (request time), not as constructor deps: HttpRouter eagerly
        // constructs every route on each request to path-match (see TODO in HttpRouter), so keeping
        // route construction cheap matters. The redirect model itself is no longer a timing
        // concern — GetActiveRedirectsUseCase's chain awaits RedirectModelProvider when it needs
        // the model, rather than depending on a setup step having already run.
        const identityCtx = this.container.resolve(IdentityContext);
        const getActiveRedirects = this.container.resolve(GetActiveRedirectsUseCase);

        const identity = identityCtx.getIdentity();
        if (identity.isAnonymous()) {
            return response.status(401).json({ message: "Not authorized." });
        }

        const result = await getActiveRedirects.execute();
        const redirectsDto = result.value.map(entry => ActiveRedirectRestMapper.toDto(entry));

        return response.header("cache-control", "public, max-age=31536000").json(redirectsDto);
    }
}

/** Its own abstraction, so the router can resolve THIS route and only this route. */
export const WebsiteBuilderRedirectsRouteHandler = createAbstraction<HttpRoute.Interface>(
    "WebsiteBuilderRedirectsRouteHandler"
);

export const WebsiteBuilderRedirectsRoute =
    WebsiteBuilderRedirectsRouteHandler.createImplementation({
        implementation: WebsiteBuilderRedirectsRouteImpl,
        dependencies: [RequestContainer]
    });

/** What the router matches on. Plain data — reading it builds nothing. */
export const WebsiteBuilderRedirectsRouteDefinition: HttpRouteDefinition.Interface = {
    method: "GET",
    path: "/wb/redirects",
    handler: WebsiteBuilderRedirectsRouteHandler
};
