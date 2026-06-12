import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { ApiGatewayEventType } from "~/eventTypes/ApiGatewayEventType.js";
import { ApiGatewayTranslator } from "~/translators/ApiGatewayTranslator.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";

export const ApiGatewayFeature = createFeature({
    name: "ApiGateway",
    register(container: Container) {
        container.register(ApiGatewayEventType);
        HttpFeature.register(container);
        container.register(ApiGatewayTranslator);
        container.register(ApiGatewayHttpRouterHandler);
    }
});
