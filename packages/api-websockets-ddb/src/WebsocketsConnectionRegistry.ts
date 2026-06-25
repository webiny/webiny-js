import WebinyError from "@webiny/error";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { createEntity } from "./entity.js";
import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { EntityQueryOptions } from "@webiny/db-dynamodb/exports/api/db.js";

const PK = `WS#CONNECTIONS`;
const GSI1_PK = "WS#CONNECTIONS#IDENTITY";
const GSI2_PK = "WS#CONNECTIONS#TENANT";

export class WebsocketsConnectionRegistry implements ConnectionRegistry.Interface {
    private readonly entity;

    public constructor(
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface
    ) {
        this.entity = createEntity({ tableFactory, entityFactory });
    }

    public async register(
        params: ConnectionRegistry.RegisterParams
    ): Promise<ConnectionRegistry.Data> {
        const { connectionId, tenant, identity, endpoint, connectedOn } = params;

        const data: ConnectionRegistry.Data = {
            connectionId,
            identity,
            tenant,
            endpoint,
            connectedOn
        };
        await this.store(data);
        return data;
    }

    public async unregister(params: ConnectionRegistry.UnregisterParams): Promise<void> {
        const { connectionId } = params;

        const keys = {
            PK,
            SK: connectionId
        };
        const original = await this.getViaConnection(connectionId);
        if (!original) {
            const message = `There is no connection with ID "${connectionId}".`;
            console.error(message);
            throw new WebinyError(message, "CONNECTION_NOT_FOUND", keys);
        }

        try {
            await this.entity.delete(keys);
        } catch (ex) {
            console.error(
                `Could not remove connection from the database: ${original.connectionId}`
            );
            throw new WebinyError(ex.message, ex.code, keys);
        }
    }

    private async getViaConnection(connectionId: string): Promise<ConnectionRegistry.Data | null> {
        const item = await this.entity.get({
            PK,
            SK: connectionId
        });
        if (!item) {
            return null;
        }
        return item?.data || null;
    }

    public async listViaConnections(connections: string[]): Promise<ConnectionRegistry.Data[]> {
        const reader = this.entity.createEntityReader({
            read: connections.map(id => {
                return {
                    PK,
                    SK: id
                };
            })
        });

        const results = await reader.execute();

        return results.map(item => {
            return item.data;
        });
    }

    public async listViaIdentity(identity: string): Promise<ConnectionRegistry.Data[]> {
        const items = await this.entity.queryAll({
            partitionKey: GSI1_PK,
            options: {
                index: "GSI1",
                eq: identity
            }
        });
        return items.map(item => {
            return item.data;
        });
    }

    public async listViaTenant(tenant: string): Promise<ConnectionRegistry.Data[]> {
        const options: Partial<EntityQueryOptions> = {
            beginsWith: `T#${tenant}`
        };

        const items = await this.entity.queryAll({
            partitionKey: GSI2_PK,
            options: {
                ...options,
                index: "GSI2"
            }
        });
        return items.map(item => {
            return item.data;
        });
    }

    public async listAll(): Promise<ConnectionRegistry.Data[]> {
        const items = await this.entity.queryAll({
            partitionKey: PK,
            options: {
                gte: " "
            }
        });
        return items.map(item => {
            return item.data;
        });
    }

    /* No-op: heartbeat-based tracking is server-only; DDB registry does not track lastSeen. */
    public async updateLastSeen(_connectionId: string): Promise<void> {
        return;
    }

    /* No-op: stale connection cleanup is server-only; DDB registry always returns empty. */
    public async listStale(_olderThan: Date): Promise<ConnectionRegistry.Data[]> {
        return [];
    }

    private async store(data: ConnectionRegistry.Data) {
        const { connectionId, tenant, identity } = data;
        const item = {
            PK,
            SK: connectionId,
            GSI1_PK,
            GSI1_SK: identity.id,
            GSI2_PK,
            GSI2_SK: `T#${tenant}`,
            GSI_TENANT: tenant,
            TYPE: "ws.connection",
            data
        };
        try {
            return await this.entity.put(item);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not store websockets connection data.",
                code: "STORE_WEBSOCKETS_CONNECTION_DATA_ERROR",
                data: item
            });
        }
    }
}
