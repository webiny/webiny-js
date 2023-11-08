import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import {
    FileManagerSystem,
    FileManagerSystemStorageOperations,
    FileManagerSystemStorageOperationsCreateParams,
    FileManagerSystemStorageOperationsGetParams,
    FileManagerSystemStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { createLegacyEntity, createTable, get, put } from "@webiny/db-dynamodb";

interface SystemStorageOperationsConstructorParams {
    documentClient: DynamoDBClient;
}

const SORT_KEY = "FM";

export class SystemStorageOperations implements FileManagerSystemStorageOperations {
    private readonly _entity: Entity<any>;

    public constructor({ documentClient }: SystemStorageOperationsConstructorParams) {
        this._entity = createLegacyEntity({
            table: createTable({ documentClient }),
            name: "System",
            attributes: {
                version: {
                    type: "string"
                },
                tenant: {
                    type: "string"
                }
            }
        });
    }

    public async get({
        tenant
    }: FileManagerSystemStorageOperationsGetParams): Promise<FileManagerSystem | null> {
        try {
            const system = await get<FileManagerSystem>({
                entity: this._entity,
                keys: {
                    PK: `T#${tenant}#SYSTEM`,
                    SK: SORT_KEY
                }
            });
            return system || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the FileManager system.",
                ex.code || "GET_SYSTEM_ERROR"
            );
        }
    }

    public async create(
        params: FileManagerSystemStorageOperationsCreateParams
    ): Promise<FileManagerSystem> {
        const { data } = params;
        try {
            await put({
                entity: this._entity,
                item: {
                    ...data,
                    PK: `T#${data.tenant}#SYSTEM`,
                    SK: SORT_KEY
                }
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not insert new system data into DynamoDB",
                "CREATE_SYSTEM_ERROR",
                {
                    data
                }
            );
        }
        return data;
    }

    public async update(
        params: FileManagerSystemStorageOperationsUpdateParams
    ): Promise<FileManagerSystem> {
        const { original, data } = params;

        try {
            await put({
                entity: this._entity,
                item: {
                    ...data,
                    PK: `T#${data.tenant}#SYSTEM`,
                    SK: SORT_KEY
                }
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not update system data in the DynamoDB.",
                "UPDATE_SYSTEM_ERROR",
                {
                    data
                }
            );
        }
        return {
            ...original,
            ...data
        };
    }
}
