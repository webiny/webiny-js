import { Entity } from "dynamodb-toolbox";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import {
    FileManagerSettings,
    FileManagerSettingsStorageOperations,
    FileManagerSettingsStorageOperationsCreateParams,
    FileManagerSettingsStorageOperationsUpdateParams,
    FileManagerStorageOperationsDeleteSettings,
    FileManagerStorageOperationsGetSettingsParams
} from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { get, createStandardEntity, createTable } from "@webiny/db-dynamodb";

interface SettingsStorageOperationsConfig {
    documentClient: DynamoDBClient;
}

const SORT_KEY = "A";

export class SettingsStorageOperations implements FileManagerSettingsStorageOperations {
    private readonly _entity: Entity<any>;

    public constructor({ documentClient }: SettingsStorageOperationsConfig) {
        this._entity = createStandardEntity({
            table: createTable({ documentClient }),
            name: "FM.Settings"
        });
    }

    public async get({
        tenant
    }: FileManagerStorageOperationsGetSettingsParams): Promise<FileManagerSettings | null> {
        try {
            const settings = await get<{ data: FileManagerSettings }>({
                entity: this._entity,
                keys: {
                    PK: `T#${tenant}#FM#SETTINGS`,
                    SK: SORT_KEY
                }
            });

            return settings ? settings.data : null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the FileManager settings.",
                ex.code || "GET_SETTINGS_ERROR"
            );
        }
    }

    public async create({
        data
    }: FileManagerSettingsStorageOperationsCreateParams): Promise<FileManagerSettings> {
        const original = await this.get({ tenant: data.tenant });

        if (original) {
            return await this.update({ original, data });
        }

        try {
            await this._entity.put({
                PK: `T#${data.tenant}#FM#SETTINGS`,
                SK: SORT_KEY,
                TYPE: "fm.settings",
                data
            });
            return data;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot create FileManager settings.",
                ex.code || "CREATE_FM_SETTINGS_ERROR",
                {
                    data
                }
            );
        }
    }

    public async update({
        data
    }: FileManagerSettingsStorageOperationsUpdateParams): Promise<FileManagerSettings> {
        try {
            await this._entity.update({
                PK: `T#${data.tenant}#FM#SETTINGS`,
                SK: SORT_KEY,
                TYPE: "fm.settings",
                data
            });
            return data;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot update FileManager settings.",
                ex.code || "UPDATE_FM_SETTINGS_ERROR",
                {
                    data
                }
            );
        }
    }

    public async delete({ tenant }: FileManagerStorageOperationsDeleteSettings): Promise<void> {
        await this._entity.delete({
            PK: `T#${tenant}#FM#SETTINGS`,
            SK: SORT_KEY
        });
    }
}
