import DataLoader from "dataloader";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { PageTemplate } from "@webiny/api-page-builder/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { createPrimaryPK } from "./keys";
import { DataContainer, DataLoaderInterface } from "~/types";

interface Params {
    entity: Entity<any>;
}

type DataLoaderGetItem = Pick<PageTemplate, "id" | "tenant" | "locale">;

export class PageTemplateDataLoader implements DataLoaderInterface {
    private _getDataLoader: DataLoader<any, any> | undefined = undefined;

    private readonly entity: Entity<any>;

    constructor(params: Params) {
        this.entity = params.entity;
    }

    public async getOne(item: DataLoaderGetItem): Promise<PageTemplate> {
        return await this.getDataLoader().load(item);
    }

    public async getAll(items: DataLoaderGetItem[]): Promise<PageTemplate[]> {
        return await this.getDataLoader().loadMany(items);
    }

    public clear(): void {
        this.getDataLoader().clearAll();
    }

    private getDataLoader() {
        if (!this._getDataLoader) {
            const cacheKeyFn = (key: DataLoaderGetItem) => {
                return `T#${key.tenant}#L#${key.locale}#${key.id}`;
            };
            this._getDataLoader = new DataLoader(
                async items => {
                    const batched = items.map(item => {
                        return this.entity.getBatch({
                            PK: createPrimaryPK(item),
                            SK: "A"
                        });
                    });

                    const records = await batchReadAll<DataContainer<PageTemplate>>({
                        table: this.entity.table,
                        items: batched
                    });

                    const results = records.reduce((collection, result) => {
                        if (!result) {
                            return collection;
                        }
                        const key = cacheKeyFn(result.data);
                        collection[key] = result.data as PageTemplate;
                        return collection;
                    }, {} as Record<string, PageTemplate>);
                    return items.map(item => {
                        const key = cacheKeyFn(item);
                        return results[key] || null;
                    });
                },
                {
                    cacheKeyFn
                }
            );
        }
        return this._getDataLoader;
    }
}
