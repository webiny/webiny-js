import { SettingsStorageOperationsDdbEs } from "./SettingsStorageOperations";
import DataLoader from "dataloader";
import { Settings } from "@webiny/api-page-builder/types";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";

interface Params {
    storageOperations: SettingsStorageOperationsDdbEs;
}

interface DataLoaderGetItem {
    PK: string;
    SK: string;
}

export class SettingsDataLoader {
    private readonly storageOperations: SettingsStorageOperationsDdbEs;

    private _getDataLoader: DataLoader<any, any>;

    constructor(params: Params) {
        this.storageOperations = params.storageOperations;
    }

    public async getOne(item: DataLoaderGetItem): Promise<Settings> {
        return await this.getDataLoader().load(item);
    }

    public async getAll(items: DataLoaderGetItem[]): Promise<Settings[]> {
        return await this.getDataLoader().loadMany(items);
    }

    public clear(): void {
        this.getDataLoader().clearAll();
    }

    private getDataLoader() {
        if (this._getDataLoader) {
            return this._getDataLoader;
        }
        const cacheKeyFn = (key: DataLoaderGetItem) => `${key.PK}#${key.SK}`;

        this._getDataLoader = new DataLoader(
            async (keys: DataLoaderGetItem[]) => {
                const batched = keys.map(key => {
                    return this.storageOperations.entity.getBatch(key);
                });

                const records = await batchReadAll<Settings>({
                    table: this.storageOperations.table,
                    items: batched
                });
                const results = records.reduce(
                    (collection, result: Settings & DataLoaderGetItem) => {
                        if (!result) {
                            return null;
                        }
                        const key = cacheKeyFn(result);
                        collection[key] = cleanupItem(this.storageOperations.entity, result);
                        return collection;
                    },
                    {} as Record<string, Settings>
                );
                return keys.map(key => {
                    const itemKey = cacheKeyFn(key);
                    return results[itemKey] || null;
                });
            },
            {
                cacheKeyFn
            }
        );
        return this._getDataLoader;
    }
}
