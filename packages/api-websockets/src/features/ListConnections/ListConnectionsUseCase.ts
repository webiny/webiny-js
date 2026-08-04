import { Result } from "@webiny/feature/api";
import { WebsocketsListConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

const RECENT_CONNECTION_WINDOW_MS = 3 * 60 * 60 * 1000;

/**
 * Parse a stored `connectedOn` value to a UTC epoch (ms).
 *
 * `connectedOn` is written as a UTC ISO string, but SQL `datetime` columns hand it back in a
 * driver-specific shape: a `Date` object (mysql2) or a `T`/`Z`-less string like "2026-08-04 17:02:06".
 * We normalize the string form back to UTC (safe — the stored wall-clock is UTC) so recency checks
 * don't depend on the driver's formatting. Returns NaN for anything unparseable.
 */
const connectedOnToEpoch = (value: unknown): number => {
    if (value instanceof Date) {
        return value.getTime();
    }
    if (typeof value === "string") {
        const normalized =
            value.includes(" ") && !value.includes("T") ? `${value.replace(" ", "T")}Z` : value;
        return new Date(normalized).getTime();
    }
    return NaN;
};

const isRecentConnection = (
    connection: WebsocketsListConnectionsUseCase.RegistryData,
    cutoff: number
): boolean => {
    const epoch = connectedOnToEpoch(connection.connectedOn);
    return Number.isFinite(epoch) && epoch >= cutoff;
};

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

        // Keep only connections seen within the recency window.
        const cutoff = Date.now() - RECENT_CONNECTION_WINDOW_MS;
        connections = connections.filter(c => isRecentConnection(c, cutoff));

        return Result.ok(connections);
    }
}

export const ListConnectionsUseCase = WebsocketsListConnectionsUseCase.createImplementation({
    implementation: ListConnectionsUseCaseImpl,
    dependencies: [ConnectionRegistry]
});
