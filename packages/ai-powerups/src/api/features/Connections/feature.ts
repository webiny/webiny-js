import { createFeature } from "@webiny/feature/api";
import ConnectionsHandler from "./ConnectionsHandler.js";
import ConnectionsGraphQLMapper from "./ConnectionsGraphQLMapper.js";

export const ConnectionsFeature = createFeature({
    name: "AiPowerUpsConnections",
    register(container) {
        container.register(ConnectionsHandler);
        container.register(ConnectionsGraphQLMapper);
    }
});
