import { createFeature } from "@webiny/feature/api";
import { WebsocketsGraphQLFactory } from "./WebsocketsGraphQLFactory.js";

export const WebsocketsGraphQLFactoryFeature = createFeature({
    name: "WebsocketsGraphQLFactory",
    register(container) {
        container.register(WebsocketsGraphQLFactory);
    }
});
