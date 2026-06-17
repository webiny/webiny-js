import { createFeature } from "@webiny/feature/api";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { ListConnectionsUseCase } from "~/features/ListConnections/ListConnectionsUseCase.js";
import { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";
import { SendToConnectionsUseCase } from "~/features/SendToConnections/SendToConnectionsUseCase.js";
import { WebsocketsSendToIdentityUseCase } from "~/features/SendToIdentity/abstractions.js";
import { SendToIdentityUseCase } from "~/features/SendToIdentity/SendToIdentityUseCase.js";
import { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
import { DisconnectUseCase } from "~/features/Disconnect/DisconnectUseCase.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsTransport } from "~/transport/index.js";

export const WebsocketsFeature = createFeature({
    name: "Websockets",
    register(container) {
        container.register(WebsocketsListConnectionsUseCase, {
            implementation: ListConnectionsUseCase,
            dependencies: [ConnectionRegistry]
        });

        container.register(WebsocketsSendToConnectionsUseCase, {
            implementation: SendToConnectionsUseCase,
            dependencies: [WebsocketsTransport]
        });

        container.register(WebsocketsSendToIdentityUseCase, {
            implementation: SendToIdentityUseCase,
            dependencies: [WebsocketsListConnectionsUseCase, WebsocketsTransport]
        });

        container.register(WebsocketsDisconnectUseCase, {
            implementation: DisconnectUseCase,
            dependencies: [
                WebsocketsListConnectionsUseCase,
                ConnectionRegistry,
                WebsocketsTransport
            ]
        });
    }
});
