import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { HttpRouteHandler } from "@webiny/event-handler-core";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import { ActiveRedirectRestMapper } from "./ActiveRedirectRestMapper.js";

/*
 * `s-maxage` is read only by shared caches, so CloudFront on AWS keeps the list until a redirect
 * write invalidates it. `max-age=0` makes every other cache, which nothing invalidates, check back.
 */
const CACHE_CONTROL = "public, max-age=0, s-maxage=31536000";

class WebsiteBuilderRedirectsRouteImpl implements HttpRouteHandler.Interface {
    constructor(
        private identityCtx: IdentityContext.Interface,
        private getActiveRedirects: GetActiveRedirectsUseCase.Interface
    ) {}

    async handle(_request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        const identity = this.identityCtx.getIdentity();
        if (identity.isAnonymous()) {
            return response.status(401).json({ message: "Not authorized." });
        }

        const result = await this.getActiveRedirects.execute();
        if (result.isFail()) {
            return response.status(500).json({ message: result.error.message });
        }
        const redirectsDto = result.value.map(entry => ActiveRedirectRestMapper.toDto(entry));

        return response.header("cache-control", CACHE_CONTROL).json(redirectsDto);
    }
}

export const WebsiteBuilderRedirectsRoute = HttpRouteHandler.createImplementation({
    implementation: WebsiteBuilderRedirectsRouteImpl,
    dependencies: [IdentityContext, GetActiveRedirectsUseCase]
});

class WebsiteBuilderRedirectsRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "website-builder-redirects";
    readonly method = "GET";
    readonly path = "/wb/redirects";
    readonly handler = WebsiteBuilderRedirectsRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const WebsiteBuilderRedirectsRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: WebsiteBuilderRedirectsRouteDefinitionImpl,
    dependencies: []
});
