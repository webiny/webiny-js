import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import type { IDisconnectUseCase } from "./abstractions.js";
import type { IWebsocketsDisconnectParams } from "./abstractions.js";
import { WebsocketsDisconnectUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketForceDisconnectError } from "~/features/shared/errors.js";
import { WebsocketForceDisconnectNotificationError } from "~/features/shared/errors.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsTransport } from "~/transport/index.js";

class DisconnectUseCaseImpl implements IDisconnectUseCase {
    private readonly listConnections: IListConnectionsUseCase;
    private readonly registry: IWebsocketsConnectionRegistry;
    private readonly transport: IWebsocketsTransport;

    public constructor(
        listConnections: IListConnectionsUseCase,
        registry: IWebsocketsConnectionRegistry,
        transport: IWebsocketsTransport
    ) {
        this.listConnections = listConnections;
        this.registry = registry;
        this.transport = transport;
    }

    public async execute(
        params?: IWebsocketsDisconnectParams,
        notify = true
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>> {
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

export const DisconnectUseCase = createImplementation({
    abstraction: WebsocketsDisconnectUseCase,
    implementation: DisconnectUseCaseImpl,
    dependencies: [WebsocketsListConnectionsUseCase, ConnectionRegistry, WebsocketsTransport]
});
