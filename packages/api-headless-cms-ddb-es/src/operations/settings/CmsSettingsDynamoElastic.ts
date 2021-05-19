import {
    CmsContext,
    CmsSettings,
    CmsSettingsStorageOperations
} from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import WebinyError from "@webiny/error";
import { createBasePartitionKey } from "../../utils";

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

export default class CmsSettingsDynamoElastic implements CmsSettingsStorageOperations {
    private readonly _context: CmsContext;
    private _partitionKey: string;

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
    }

    public async get(): Promise<CmsSettings> {
        const { db } = this.context;
        const [[settings]] = await db.read<CmsSettingsDb>({
            ...configurations.db(),
            query: {
                PK: this.partitionKey,
                SK: SETTINGS_SECONDARY_KEY
            }
        });
        if (!settings) {
            return null;
        }
        return convertFromDbData(settings);
    }

    public async create(data: CmsSettings): Promise<void> {
        const { db } = this.context;
        const dbData = convertToDbData(data);
        try {
            await db.create({
                ...configurations.db(),
                data: {
                    PK: this.partitionKey,
                    SK: SETTINGS_SECONDARY_KEY,
                    ...dbData
                }
            });
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
        const { db } = this.context;
        try {
            await db.update({
                ...configurations.db(),
                query: {
                    PK: this.partitionKey,
                    SK: SETTINGS_SECONDARY_KEY
                },
                data: convertToDbData(data)
            });
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
