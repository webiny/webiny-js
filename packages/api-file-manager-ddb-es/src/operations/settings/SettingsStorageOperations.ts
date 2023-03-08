import {
    FileManagerSettings,
    FileManagerSettingsStorageOperations,
    FileManagerSettingsStorageOperationsCreateParams,
    FileManagerSettingsStorageOperationsUpdateParams
} from "@webiny/api-file-manager/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineTable from "~/definitions/table";
import defineSettingsEntity from "~/definitions/settingsEntity";
import { FileManagerContext } from "~/types";
import { queryOne } from "@webiny/db-dynamodb/utils/query";

interface SettingsStorageOperationsConstructorParams {
    context: FileManagerContext;
}

const SORT_KEY = "A";

export class SettingsStorageOperations implements FileManagerSettingsStorageOperations {
    private readonly _context: FileManagerContext;
    private readonly _entity: Entity<any>;

    private get partitionKey(): string {
        const tenant = this._context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        return `T#${tenant.id}#FM#SETTINGS`;
    }

    public constructor({ context }: SettingsStorageOperationsConstructorParams) {
        this._context = context;
        const table = defineTable({
            context
        });

        this._entity = defineSettingsEntity({
            context,
            table
        });
    }

    public async get(): Promise<FileManagerSettings | null> {
        try {
            const settings = await queryOne<{ data: FileManagerSettings }>({
                entity: this._entity,
                partitionKey: this.partitionKey,
                options: {
                    eq: SORT_KEY
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
        const original = await this.get();
        /**
         * TODO: check if need to throw an error on existing settings
         */
        if (original) {
            return await this.update({ original, data });
        }

        try {
            await this._entity.put({
                PK: this.partitionKey,
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
                PK: this.partitionKey,
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

    public async delete(): Promise<void> {
        return this._entity.delete({
            PK: this.partitionKey,
            SK: SORT_KEY
        });
    }
}
