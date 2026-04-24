import WebinyError from "@webiny/error";
import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData,
    IWebsocketsConnectionRegistryRegisterParams,
    IWebsocketsConnectionRegistryUnregisterParams
} from "./abstractions/IWebsocketsConnectionRegistry.js";
import { createEntity } from "~/registry/entity.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";

const PK = `WS#CONNECTIONS`;
const GSI1_PK = "WS#CONNECTIONS#IDENTITY";
const GSI2_PK = "WS#CONNECTIONS#TENANT";

export class WebsocketsConnectionRegistry implements IWebsocketsConnectionRegistry {
    private readonly entity;

    public constructor(documentClient: DynamoDBDocument) {
        this.entity = createEntity(documentClient);
    }

    public async register(
        params: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData> {
        const { connectionId, tenant, identity, domainName, stage, connectedOn } = params;

        const data: IWebsocketsConnectionRegistryData = {
            connectionId,
            identity,
            tenant,
            domainName,
            stage,
            connectedOn
        };
        await this.store(data);
        return data;
    }

    public async unregister(params: IWebsocketsConnectionRegistryUnregisterParams): Promise<void> {
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

    private async getViaConnection(
        connectionId: string
    ): Promise<IWebsocketsConnectionRegistryData | null> {
        const item = await this.entity.get({
            PK,
            SK: connectionId
        });
        if (!item) {
            return null;
        }
        return item?.data || null;
    }

    /**
     * Uses Primary keys
     */
    public async listViaConnections(
        connections: string[]
    ): Promise<IWebsocketsConnectionRegistryData[]> {
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

    /**
     * Uses GSI1 keys
     */
    public async listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]> {
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

    /**
     * Uses GSI2 keys
     */
    public async listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]> {
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

    public async listAll(): Promise<IWebsocketsConnectionRegistryData[]> {
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

    private async store(data: IWebsocketsConnectionRegistryData) {
        const { connectionId, tenant, identity } = data;
        const item = {
            // to find specific identity related to given connection
            PK,
            SK: connectionId,
            // to find all connections related to given identity
            GSI1_PK,
            GSI1_SK: identity.id,
            // to find all connections related to given tenant
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
