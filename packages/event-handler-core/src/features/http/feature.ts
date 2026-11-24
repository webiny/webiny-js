import { createFeature } from "@webiny/feature/api";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import { HttpErrorDecorator } from "~/features/http/decorators/HttpErrorDecorator.js";
import { SecureHeadersDecorator } from "~/features/http/decorators/SecureHeadersDecorator.js";
import { CompressionDecorator } from "~/features/http/decorators/CompressionDecorator.js";

export const HttpFeature = createFeature({
    name: "Http",
    register(container) {
        // Transient so per-request routes (e.g. GraphQLRoute) resolve from child container
        container.register(HttpRouterImpl);
        /*
         * Decorators registered earlier sit further inside. An error thrown by a route, or by a
         * decorator registered before this feature, becomes a response here, and that response then
         * gets the CORS headers from SecureHeadersDecorator.
         */
        container.registerDecorator(HttpErrorDecorator);
        container.registerDecorator(SecureHeadersDecorator);
        // Registered last so it's the OUTERMOST decorator: it compresses the fully-formed response
        // (after CORS/other headers are set). Emits a gzip/br Buffer body — both terminal transports
        // already handle Buffers (API Gateway base64 + isBase64Encoded; Node server raw bytes).
        container.registerDecorator(CompressionDecorator);
    }
});
