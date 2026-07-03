import { createFeature } from "@webiny/feature/api";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import { SecureHeadersDecorator } from "~/features/http/decorators/SecureHeadersDecorator.js";
import { RequestContextInitializerDecorator } from "~/features/http/decorators/RequestContextInitializerDecorator.js";

export const HttpFeature = createFeature({
    name: "Http",
    register(container) {
        // Transient so per-request routes (e.g. GraphQLRoute) resolve from child container
        container.register(HttpRouterImpl);
        // Registered before SecureHeaders so SecureHeaders stays the OUTER decorator (it short-
        // circuits OPTIONS before we do the per-request initializer work). This runs the post-auth
        // RequestContextInitializers for every HTTP route, not just the GraphQL engine.
        container.registerDecorator(RequestContextInitializerDecorator);
        container.registerDecorator(SecureHeadersDecorator);
    }
});
