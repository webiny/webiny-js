import WebinyError from "@webiny/error";
import {
    ISocketsConnectionRegistry,
    ISocketsConnectionRegistryData,
    ISocketsConnectionRegistryRegisterParams,
    ISocketsConnectionRegistryUnregisterParams
} from "./abstractions/ISocketsConnectionRegistry";
import { createEntity } from "~/registry/entity";
import { deleteItem, get, put, queryAll } from "@webiny/db-dynamodb";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox";

const PK = `WS#CONNECTIONS`;
const GSI1_PK = "WS#CONNECTIONS#IDENTITY";
const GSI2_PK = "WS#CONNECTIONS#TENANT#LOCALE";

interface ISocketsConnectionRegistryDbItem {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    GSI2_PK: string;
    GSI2_SK: string;
    data: ISocketsConnectionRegistryData;
}

export class SocketsConnectionRegistry implements ISocketsConnectionRegistry {
    private readonly entity: ReturnType<typeof createEntity>;

    public constructor(documentClient: DynamoDBDocument) {
        this.entity = createEntity(documentClient);
    }

    public async register(
        params: ISocketsConnectionRegistryRegisterParams
    ): Promise<ISocketsConnectionRegistryData> {
        const { connectionId, tenant, locale, identity, domainName, stage } = params;

        const data: ISocketsConnectionRegistryData = {
            connectionId,
            identity,
            tenant,
            locale,
            domainName,
            stage,
            connectedOn: new Date().toISOString()
        };
        await this.store(data);
        return data;
    }

    public async unregister(params: ISocketsConnectionRegistryUnregisterParams): Promise<void> {
        const { connectionId } = params;

        const keys = {
            PK,
            SK: connectionId
        };
        const original = await get<ISocketsConnectionRegistryDbItem>({
            entity: this.entity,
            keys
        });
        if (!original) {
            const message = `There is no connection with ID "${connectionId}".`;
            throw new WebinyError(message, "CONNECTION_NOT_FOUND", keys);
        }

        try {
            await deleteItem({
                entity: this.entity,
                keys
            });
        } catch (ex) {
            console.log(
                `Could not remove connection from the database: ${original.data.connectionId}`
            );
            throw new WebinyError(ex.message, ex.code, keys);
        }
    }
    /**
     * Uses GSI1 keys
     */
    public async listViaIdentity(identity: string): Promise<ISocketsConnectionRegistryData[]> {
        const items = await queryAll<ISocketsConnectionRegistryDbItem>({
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
    ): Promise<ISocketsConnectionRegistryData[]> {
        let options: Partial<EntityQueryOptions> = {
            beginsWith: `T#${tenant}#L#`
        };
        if (locale) {
            options = {
                eq: `T#${tenant}#L#${locale}`
            };
        }
        const items = await queryAll<ISocketsConnectionRegistryDbItem>({
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

    private async store(data: ISocketsConnectionRegistryData) {
        const { connectionId, tenant, locale, identity } = data;
        const item: ISocketsConnectionRegistryDbItem = {
            // to find specific identity related to given connection
            PK,
            SK: connectionId,
            // to find all connections related to given identity
            GSI1_PK,
            GSI1_SK: identity,
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
