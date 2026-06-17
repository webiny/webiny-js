import { createFeature } from "@webiny/feature/api";
import { ListConnectionsUseCase } from "~/features/ListConnections/ListConnectionsUseCase.js";
import { SendToConnectionsUseCase } from "~/features/SendToConnections/SendToConnectionsUseCase.js";
import { SendToIdentityUseCase } from "~/features/SendToIdentity/SendToIdentityUseCase.js";
import { DisconnectUseCase } from "~/features/Disconnect/DisconnectUseCase.js";

export const WebsocketsFeature = createFeature({
    name: "Websockets",
    register(container) {
        container.register(ListConnectionsUseCase);
        container.register(SendToConnectionsUseCase);
        container.register(SendToIdentityUseCase);
        container.register(DisconnectUseCase);
    }
});
