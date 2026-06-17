import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/index.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { IListConnectionsUseCase } from "./abstractions.js";
import type { IWebsocketsListConnectionsParams } from "./abstractions.js";
import { WebsocketsListConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

class ListConnectionsUseCaseImpl implements IListConnectionsUseCase {
    private readonly registry: IWebsocketsConnectionRegistry;

    public constructor(registry: IWebsocketsConnectionRegistry) {
        this.registry = registry;
    }

    public async execute(
        params?: IWebsocketsListConnectionsParams
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>> {
        let connections: IWebsocketsConnectionRegistryData[] = [];

        try {
            const where = params?.where || {};
            if (where.identityId) {
                connections = await this.registry.listViaIdentity(where.identityId);
            } else if (where.connections) {
                connections = await this.registry.listViaConnections(where.connections);
            } else if (where.tenant) {
                connections = await this.registry.listViaTenant(where.tenant);
            } else {
                connections = await this.registry.listAll();
            }
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error as Error));
        }

        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        connections = connections.filter(c => c.connectedOn >= threeHoursAgo);

        return Result.ok(connections);
    }
}

export const ListConnectionsUseCase = createImplementation({
    abstraction: WebsocketsListConnectionsUseCase,
    implementation: ListConnectionsUseCaseImpl,
    dependencies: [ConnectionRegistry]
});
