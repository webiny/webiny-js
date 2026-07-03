import type { Container } from "@webiny/di";
import { HttpRouter } from "~/features/http/abstractions.js";
import type { IHttpRouter, IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { runRequestContextInitializers } from "~/features/events/runRequestContextInitializers.js";

/**
 * Runs the post-auth {@link RequestContextInitializer}s once per request, for EVERY HTTP route
 * (graphql, cms, /files/* asset delivery, ...) — not just the GraphQL engine. It's transport-
 * agnostic: it lives in event-handler-core and depends only on DI abstractions. The transport's
 * auth decorators (e.g. ApiGatewayIdentityLoaderDecorator / ApiGatewayTenantLoaderDecorator)
 * establish identity/tenant BEFORE control reaches HttpRouter, so by the time this runs, the request
 * context is established.
 */
class RequestContextInitializerDecoratorImpl implements IHttpRouter {
    constructor(
        private container: Container,
        private decoratee: IHttpRouter
    ) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        await runRequestContextInitializers(this.container);
        return this.decoratee.route(request);
    }
}

export const RequestContextInitializerDecorator = HttpRouter.createDecorator({
    decorator: RequestContextInitializerDecoratorImpl,
    dependencies: [RequestContainer]
});
