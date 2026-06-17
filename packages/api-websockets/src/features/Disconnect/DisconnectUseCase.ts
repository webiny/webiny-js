import { Result } from "@webiny/feature/api";
import { WebsocketsDisconnectUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketForceDisconnectError } from "~/features/shared/errors.js";
import { WebsocketForceDisconnectNotificationError } from "~/features/shared/errors.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsTransport } from "~/transport/index.js";

class DisconnectUseCaseImpl implements WebsocketsDisconnectUseCase.Interface {
    public constructor(
        private readonly listConnections: WebsocketsListConnectionsUseCase.Interface,
        private readonly registry: ConnectionRegistry.Interface,
        private readonly transport: WebsocketsTransport.Interface
    ) {}

    public async execute(
        params?: WebsocketsDisconnectUseCase.Params,
        notify = true
    ): Promise<Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>> {
        const result = await this.listConnections.execute(params);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const connections = result.value;

        for (const connection of connections) {
            try {
                await this.registry.unregister(connection);
            } catch {
                /* Intentional: failed unregister for one connection must not prevent disconnecting others. */
            }
        }

        if (notify) {
            try {
                await this.transport.send(connections, {
                    action: "forcedDisconnect"
                });
            } catch (error) {
                return Result.fail(new WebsocketForceDisconnectNotificationError(error));
            }
        }

        try {
            await this.transport.disconnect(connections);
        } catch (error) {
            return Result.fail(new WebsocketForceDisconnectError(error));
        }

        return Result.ok(connections);
    }
}

export const DisconnectUseCase = WebsocketsDisconnectUseCase.createImplementation({
    implementation: DisconnectUseCaseImpl,
    dependencies: [WebsocketsListConnectionsUseCase, ConnectionRegistry, WebsocketsTransport]
});
