import {
    CmsContext,
    CmsSettings,
    CmsSettingsStorageOperations
} from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import WebinyError from "@webiny/error";
import { createBasePartitionKey } from "../../utils";
import { Entity, Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable } from "../helpers";

interface ConstructorArgs {
    context: CmsContext;
}
// @ts-ignore
interface CmsSettingsDb extends CmsSettings {
    contentModelLastChange: string;
}

const convertToDbData = (data: CmsSettings): CmsSettingsDb => {
    return {
        ...data,
        contentModelLastChange: data.contentModelLastChange.toISOString()
    };
};

const convertFromDbData = (data?: CmsSettingsDb): CmsSettings | null => {
    if (!data) {
        return null;
    }
    let contentModelLastChange;
    try {
        contentModelLastChange = new Date(data.contentModelLastChange);
    } catch {
        contentModelLastChange = new Date();
    }
    return {
        ...data,
        contentModelLastChange
    };
};

const SETTINGS_SECONDARY_KEY = "settings";

export default class CmsSettingsDynamo implements CmsSettingsStorageOperations {
    private readonly _context: CmsContext;
    private _partitionKey: string;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        if (!this._partitionKey) {
            this._partitionKey = `${createBasePartitionKey(this.context)}#SETTINGS`;
        }
        return this._partitionKey;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;

        this._table = new Table({
            name: configurations.db().table || getTable(context),
            partitionKey: "PK",
            sortKey: "SK",
            DocumentClient: getDocumentClient(context)
        });
        this._entity = new Entity({
            name: "System",
            table: this._table,
            attributes: {
                PK: {
                    partitionKey: true
                },
                SK: {
                    sortKey: true
                },
                contentModelLastChange: {
                    type: "string"
                }
            }
        });
    }

    public async get(): Promise<CmsSettings> {
        const response = await this._entity.get({
            PK: this.partitionKey,
            SK: SETTINGS_SECONDARY_KEY
        });

        if (!response || !response.Item) {
            return null;
        }
        return convertFromDbData(response.Item);
    }

    public async create(data: CmsSettings): Promise<void> {
        const dbData = convertToDbData(data);
        try {
            const result = await this._entity.put({
                PK: this.partitionKey,
                SK: SETTINGS_SECONDARY_KEY,
                ...dbData
            });
            if (!result) {
                throw new WebinyError(
                    "Could not create the settings data - no result.",
                    "CREATE_SETTINGS_ERROR"
                );
            }
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create settings.",
                ex.code || "CREATE_SETTINGS_ERROR",
                {
                    error: ex,
                    data
                }
            );
        }
    }

    public async update(data: CmsSettings): Promise<void> {
        try {
            const result = await this._entity.update({
                PK: this.partitionKey,
                SK: SETTINGS_SECONDARY_KEY,
                ...convertToDbData(data)
            });
            if (!result) {
                throw new WebinyError(
                    "Could not update the settings data - no result.",
                    "CREATE_SETTINGS_ERROR"
                );
            }
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update settings.",
                ex.code || "UPDATE_SETTINGS_ERROR",
                {
                    error: ex,
                    data
                }
            );
        }
    }
}
