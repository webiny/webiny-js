import { Result } from "@webiny/feature/api";
import { WebsocketsListConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

class ListConnectionsUseCaseImpl implements WebsocketsListConnectionsUseCase.Interface {
    public constructor(private readonly registry: ConnectionRegistry.Interface) {}

    public async execute(
        params?: WebsocketsListConnectionsUseCase.Params
    ): Promise<Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>> {
        let connections: WebsocketsListConnectionsUseCase.RegistryData[] = [];

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

export const ListConnectionsUseCase = WebsocketsListConnectionsUseCase.createImplementation({
    implementation: ListConnectionsUseCaseImpl,
    dependencies: [ConnectionRegistry]
});
