import { PbContext } from "@webiny/api-page-builder/graphql/types";
import DataLoader from "dataloader";
import { CategoryStorageOperationsDdb } from "./CategoryStorageOperations";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { Category } from "@webiny/api-page-builder/types";
import WebinyError from "@webiny/error";

interface Params {
    context: PbContext;
    storageOperations: CategoryStorageOperationsDdb;
}

interface DataLoaderGetItem {
    slug: string;
    tenant: string;
    locale: string;
}

export class CategoryDataLoader {
    private readonly context: PbContext;
    private readonly storageOperations: CategoryStorageOperationsDdb;

    private readonly dataLoaders: Map<string, DataLoader> = new Map();

    constructor(params: Params) {
        this.context = params.context;
        this.storageOperations = params.storageOperations;
    }

    public async getOne(item: DataLoaderGetItem): Promise<Category[]> {
        return await this.getDataLoader("get").load(item);
    }

    private getDataLoader(name: string): DataLoader<any, any> {
        const target = `dataLoader${name.ucfirst()}`;
        if (this.dataLoaders.has(target)) {
            return this.dataLoaders.get(target);
        } else if (typeof this[target] !== "function") {
            throw new WebinyError(
                `Missing data loader "${name}" definition.`,
                "MISSING_DATA_LOADER",
                {
                    target,
                    name
                }
            );
        }
        const dl = this[target]();
        this.dataLoaders.set(name, dl);
        return dl;
    }

    private dataLoaderGet() {
        return new DataLoader(async (items: DataLoaderGetItem[]) => {
            const batch = items.map(item => {
                return this.storageOperations.entity.getBatch({
                    PK: this.storageOperations.createPartitionKey(item),
                    SK: item.slug
                });
            });

            return await batchReadAll<Category>(batch);
        });
    }
}
