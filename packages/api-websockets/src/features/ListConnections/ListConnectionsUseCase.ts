import { Result } from "@webiny/feature/api";
import { WebsocketsListConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "@webiny/api-core/features/websockets/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

/*
 * Lists the current tenant's connections only, whatever the filter. Every caller (GraphQL queries
 * and mutations, sends to an identity, disconnects) acts on what this returns, so another tenant's
 * connection ids, or an identity also connected elsewhere, never reach outside the tenant. An admin
 * who manages another tenant sends the request to that tenant.
 */
class ListConnectionsUseCaseImpl implements WebsocketsListConnectionsUseCase.Interface {
    public constructor(
        private readonly registry: ConnectionRegistry.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public async execute(
        params?: WebsocketsListConnectionsUseCase.Params
    ): Promise<Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>> {
        let connections: WebsocketsListConnectionsUseCase.RegistryData[] = [];

        try {
            const tenant = this.tenantContext.getTenant()?.id;
            if (!tenant) {
                throw new Error("Cannot list websocket connections without a current tenant.");
            }

            const where = params?.where || {};
            if (where.identityId) {
                connections = await this.registry.listViaIdentity(where.identityId);
            } else if (where.connections) {
                connections = await this.registry.listViaConnections(where.connections);
            } else {
                connections = await this.registry.listViaTenant(tenant);
            }

            connections = connections.filter(c => c.tenant === tenant);
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
    dependencies: [ConnectionRegistry, TenantContext]
});
