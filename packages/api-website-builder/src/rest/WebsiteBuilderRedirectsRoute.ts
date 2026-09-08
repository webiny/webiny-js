import {
    HttpRoute,
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import { ActiveRedirectRestMapper } from "./ActiveRedirectRestMapper.js";

class WebsiteBuilderRedirectsRouteImpl implements HttpRoute.Interface {
    constructor(private container: Container) {}

    async handle(_request: HttpRoute.Request, response: HttpRoute.Response) {
        // TODO: declare these as constructor dependencies. They were resolved lazily because the
        // router used to construct every route on every request to path-match, which is no longer
        // true — a route is built only once its definition matches.
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

export const WebsiteBuilderRedirectsRoute = HttpRouteHandler.createImplementation({
    implementation: WebsiteBuilderRedirectsRouteImpl,
    dependencies: [RequestContainer]
});

class WebsiteBuilderRedirectsRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly method = "GET";
    readonly path = "/wb/redirects";
    readonly handler = WebsiteBuilderRedirectsRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const WebsiteBuilderRedirectsRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: WebsiteBuilderRedirectsRouteDefinitionImpl,
    dependencies: []
});
