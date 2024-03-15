import WebinyError from "@webiny/error";
import {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData,
    IWebsocketsConnectionRegistryRegisterParams,
    IWebsocketsConnectionRegistryUnregisterParams
} from "./abstractions/IWebsocketsConnectionRegistry";
import { createEntity } from "~/registry/entity";
import { batchReadAll, deleteItem, get, put, queryAll } from "@webiny/db-dynamodb";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox";

const PK = `WS#CONNECTIONS`;
const GSI1_PK = "WS#CONNECTIONS#IDENTITY";
const GSI2_PK = "WS#CONNECTIONS#TENANT#LOCALE";

interface IWebsocketsConnectionRegistryDbItem {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    GSI2_PK: string;
    GSI2_SK: string;
    data: IWebsocketsConnectionRegistryData;
}

export class WebsocketsConnectionRegistry implements IWebsocketsConnectionRegistry {
    private readonly entity: ReturnType<typeof createEntity>;

    public constructor(documentClient: DynamoDBDocument) {
        this.entity = createEntity(documentClient);
    }

    public async register(
        params: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData> {
        const { connectionId, tenant, locale, identity, domainName, stage, connectedOn } = params;

        const data: IWebsocketsConnectionRegistryData = {
            connectionId,
            identity,
            tenant,
            locale,
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
            await deleteItem({
                entity: this.entity,
                keys
            });
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
        const item = await get<IWebsocketsConnectionRegistryDbItem>({
            entity: this.entity,
            keys: {
                PK,
                SK: connectionId
            }
        });
        return item?.data || null;
    }

    /**
     * Uses Primary keys
     */
    public async listViaConnections(
        connections: string[]
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        const items = connections.map(connectionId => {
            return this.entity.getBatch({
                PK,
                SK: connectionId
            });
        });

        const results = await batchReadAll<IWebsocketsConnectionRegistryDbItem>({
            table: this.entity.table,
            items
        });

        return results.map(item => {
            return item.data;
        });
    }

    /**
     * Uses GSI1 keys
     */
    public async listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]> {
        const items = await queryAll<IWebsocketsConnectionRegistryDbItem>({
            entity: this.entity,
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
    public async listViaTenant(
        tenant: string,
        locale?: string
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        let options: Partial<EntityQueryOptions> = {
            beginsWith: `T#${tenant}#L#`
        };
        if (locale) {
            options = {
                eq: `T#${tenant}#L#${locale}`
            };
        }
        const items = await queryAll<IWebsocketsConnectionRegistryDbItem>({
            entity: this.entity,
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
        const items = await queryAll<IWebsocketsConnectionRegistryDbItem>({
            entity: this.entity,
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
        const { connectionId, tenant, locale, identity } = data;
        const item: IWebsocketsConnectionRegistryDbItem = {
            // to find specific identity related to given connection
            PK,
            SK: connectionId,
            // to find all connections related to given identity
            GSI1_PK,
            GSI1_SK: identity.id,
            // to find all connections related to given tenant/locale combination
            GSI2_PK,
            GSI2_SK: `T#${tenant}#L#${locale}`,
            data
        };
        try {
            return await put({
                entity: this.entity,
                item
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not store websockets connection data.",
                code: "STORE_WEBSOCKETS_CONNECTION_DATA_ERROR",
                data: item
            });
        }
    }
}
