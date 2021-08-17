import { PbContext } from "@webiny/api-page-builder/graphql/types";
import DataLoader from "dataloader";
import { CategoryStorageOperationsDdbEs } from "./CategoryStorageOperations";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { Category } from "@webiny/api-page-builder/types";
import WebinyError from "@webiny/error";

interface Params {
    context: PbContext;
    storageOperations: CategoryStorageOperationsDdbEs;
}

interface DataLoaderGetItem {
    slug: string;
    tenant: string;
    locale: string;
}

export class CategoryDataLoader {
    private readonly context: PbContext;
    private readonly storageOperations: CategoryStorageOperationsDdbEs;

    private readonly dataLoaders: Map<string, DataLoader<any, any>> = new Map();

    constructor(params: Params) {
        this.context = params.context;
        this.storageOperations = params.storageOperations;
    }

    public async getOne(item: DataLoaderGetItem): Promise<Category> {
        return await this.getDataLoader("get").load(item);
    }

    public async getAll(items: DataLoaderGetItem[]): Promise<Category[]> {
        return await this.getDataLoader("get").loadMany(items);
    }

    public clear(): void {
        for (const loader of this.dataLoaders.values()) {
            loader.clearAll();
        }
    }

    private getDataLoader(name: string): DataLoader<any, any> {
        const upperName = `${name.substr(0, 1).toUpperCase()}${name.substr(1)}`;
        const fn = `_dataLoader${upperName}`;
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

    private _dataLoaderGet() {
        return new DataLoader(async (items: DataLoaderGetItem[]) => {
            const batched = items.map(item => {
                return this.storageOperations.entity.getBatch({
                    PK: this.storageOperations.createPartitionKey(item),
                    SK: item.slug
                });
            });

            return await batchReadAll<Category>({
                table: this.storageOperations.table,
                items: batched
            });
        });
    }
}
