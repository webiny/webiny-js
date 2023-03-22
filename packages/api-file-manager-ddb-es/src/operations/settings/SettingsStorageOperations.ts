import {
    FileManagerSettings,
    FileManagerSettingsStorageOperations,
    FileManagerSettingsStorageOperationsCreateParams,
    FileManagerSettingsStorageOperationsUpdateParams,
    FileManagerStorageOperationsDeleteSettings,
    FileManagerStorageOperationsGetSettingsParams
} from "@webiny/api-file-manager/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineSettingsEntity from "~/definitions/settingsEntity";
import { get } from "@webiny/db-dynamodb/utils/get";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createTable } from "~/definitions/table";

interface SettingsStorageOperationsConstructorParams {
    documentClient: DocumentClient;
}

const SORT_KEY = "A";

export class SettingsStorageOperations implements FileManagerSettingsStorageOperations {
    private readonly _entity: Entity<any>;

    public constructor({ documentClient }: SettingsStorageOperationsConstructorParams) {
        const table = createTable({ documentClient });

        this._entity = defineSettingsEntity({ table });
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
        /**
         * TODO: check if need to throw an error on existing settings
         */
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
        return this._entity.delete({
            PK: `T#${tenant}#FM#SETTINGS`,
            SK: SORT_KEY
        });
    }
}
