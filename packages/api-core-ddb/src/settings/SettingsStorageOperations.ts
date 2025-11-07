import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { getClean, put, deleteItem } from "@webiny/db-dynamodb";
import { WebinyError } from "@webiny/error";
import type { GenericRecord } from "@webiny/api/types.js";
import { SettingsDynamoTable } from "./SettingsDynamoTable.js";
import { SettingsStorageOperations as StorageAbstraction } from "@webiny/api-core/features/settings";
import type { SettingsStorageRecord } from "@webiny/api-core/features/settings/shared/types.js";

export class SettingsStorageOperations implements StorageAbstraction.Interface {
    private table: SettingsDynamoTable;

    constructor(dynamoDbClient: DynamoDBDocument) {
        this.table = new SettingsDynamoTable(dynamoDbClient);
    }

    async getSettings(
        params: StorageAbstraction.GetSettingsParams
    ): Promise<SettingsStorageRecord | null> {
        try {
            const entry = await getClean<{ data: GenericRecord<string> }>({
                entity: this.table.getEntity(),
                keys: this.table.createKeys(params)
            });

            if (!entry) {
                return null;
            }

            return {
                name: params.name,
                tenant: params.tenant,
                data: entry.data
            };
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not get settings.",
                code: "GET_SETTINGS_ERROR",
                data: params
            });
        }
    }

    async updateSettings({
        name,
        tenant,
        data
    }: StorageAbstraction.UpdateSettingsParams): Promise<void> {
        try {
            const keys = {
                ...this.table.createKeys({ name, tenant }),
                ...this.table.createGsiKeys({ name, tenant })
            };

            await put({
                entity: this.table.getEntity(),
                item: {
                    ...keys,
                    data
                }
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update settings.",
                code: "UPDATE_SETTINGS_ERROR",
                data: { name, tenant, data }
            });
        }
    }

    async deleteSettings({ name, tenant }: StorageAbstraction.DeleteSettingsParams): Promise<void> {
        try {
            await deleteItem({
                entity: this.table.getEntity(),
                keys: this.table.createKeys({ name, tenant })
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete settings.",
                code: "DELETE_SETTINGS_ERROR",
                data: { name, tenant }
            });
        }
    }
}
