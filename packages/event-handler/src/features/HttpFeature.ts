import { createFeature } from "@webiny/feature/api";
import { HttpRouterImpl } from "../handlers/HttpRouterImpl.js";
import { SecureHeadersDecorator } from "../handlers/SecureHeadersDecorator.js";

export const HttpFeature = createFeature({
    name: "Http",
    register(container) {
        container.register(HttpRouterImpl).inSingletonScope();
        container.registerDecorator(SecureHeadersDecorator);
    }
});
