import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createWebsocketsContext } from "~/context/index.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export const WebsocketsFeature = createFeature({
    name: "Websockets",
    register(container: Container) {
        registerLegacyPluginsViaGqlContextEnhancer(container, [
            createWebsocketsContext(),
            createWebsocketsGraphQL()
        ]);
    }
});
