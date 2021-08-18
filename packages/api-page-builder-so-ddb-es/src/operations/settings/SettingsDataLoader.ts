import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { SettingsStorageOperationsDdbEs } from "./SettingsStorageOperations";
import DataLoader from "dataloader";
import { Settings } from "@webiny/api-page-builder/types";
import WebinyError from "@webiny/error";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";

interface Params {
    context: PbContext;
    storageOperations: SettingsStorageOperationsDdbEs;
}

interface DataLoaderGetItem {
    PK: string;
    SK: string;
}

export class SettingsDataLoader {
    private readonly context: PbContext;
    private readonly storageOperations: SettingsStorageOperationsDdbEs;

    private readonly dataLoaders: Map<string, DataLoader<any, any>> = new Map();

    constructor(params: Params) {
        this.context = params.context;
        this.storageOperations = params.storageOperations;
    }

    public async getOne(item: DataLoaderGetItem): Promise<Settings> {
        return await this.getDataLoader("get").load(item);
    }

    public async getAll(items: DataLoaderGetItem[]): Promise<Settings[]> {
        return await this.getDataLoader("get").loadMany(items);
    }

    public clear(): void {
        for (const loader of this.dataLoaders.values()) {
            loader.clearAll();
        }
    }

    private getDataLoader(name: string): DataLoader<any, any> {
        const fn = `_${name}`;
        if (this.dataLoaders.has(fn)) {
            return this.dataLoaders.get(fn);
        } else if (typeof this[fn] !== "function") {
            throw new WebinyError(
                `Missing data loader "${name}" definition.`,
                "MISSING_DATA_LOADER",
                {
                    fn,
                    name
                }
            );
        }
        const loader = this[fn]();
        this.dataLoaders.set(name, loader);
        return loader;
    }

    private _get() {
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
        return new DataLoader(fn, options);
    }
}
