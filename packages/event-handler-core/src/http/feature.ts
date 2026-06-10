import { createFeature } from "@webiny/feature/api";
import { HttpRouterImpl } from "~/http/HttpRouter.js";
import { SecureHeadersDecorator } from "~/http/decorators/SecureHeadersDecorator.js";

export const HttpFeature = createFeature({
    name: "Http",
    register(container) {
        // Transient so per-request routes (e.g. GraphQLRoute) resolve from child container
        container.register(HttpRouterImpl);
        container.registerDecorator(SecureHeadersDecorator);
    }
});
