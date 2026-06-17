import { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import type { IDisconnectUseCase, IWebsocketsDisconnectParams } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import {
    WebsocketForceDisconnectError,
    WebsocketForceDisconnectNotificationError
} from "~/features/shared/errors.js";

export class DisconnectUseCase implements IDisconnectUseCase {
    private readonly listConnections: IListConnectionsUseCase;
    private readonly registry: IWebsocketsConnectionRegistry;
    private readonly transport: IWebsocketsTransport;

    constructor(
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
