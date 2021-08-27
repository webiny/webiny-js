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
        const fn = async (items: DataLoaderGetItem[]) => {
            const batched = items.map(item => {
                return this.storageOperations.entity.getBatch(item);
            });

            const results = await batchReadAll<Settings>({
                table: this.storageOperations.table,
                items: batched
            });
            return results.map(result => cleanupItem(this.storageOperations.entity, result));
        };

        const options = {
            cacheKeyFn: key => `${key.PK}#${key.SK}`
        };
        this._getDataLoader = new DataLoader(fn, options);
        return this._getDataLoader;
    }
}
