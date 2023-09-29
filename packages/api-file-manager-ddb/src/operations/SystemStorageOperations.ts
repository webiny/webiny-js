import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Entity } from "dynamodb-toolbox";
import {
    FileManagerSystem,
    FileManagerSystemStorageOperations,
    FileManagerSystemStorageOperationsCreateParams,
    FileManagerSystemStorageOperationsGetParams,
    FileManagerSystemStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { createLegacyEntity, createTable } from "@webiny/db-dynamodb";

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
            const system = (await this._entity.get({
                PK: `T#${tenant}#SYSTEM`,
                SK: SORT_KEY
            })) as any;
            if (!system || !system.Item) {
                return null;
            }
            return system.Item;
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
            await this._entity.put({
                PK: `T#${data.tenant}#SYSTEM`,
                SK: SORT_KEY,
                ...data
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
            await this._entity.update({
                PK: `T#${data.tenant}#SYSTEM`,
                SK: SORT_KEY,
                ...data
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
