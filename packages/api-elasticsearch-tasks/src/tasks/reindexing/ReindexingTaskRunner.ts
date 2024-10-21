import {
    IDynamoDbElasticsearchRecord,
    IElasticsearchIndexingTaskValues,
    IElasticsearchIndexingTaskValuesKeys,
    IManager
} from "~/types";
import { ITaskResponse, ITaskResponseResult } from "@webiny/tasks/response/abstractions";
import { scan } from "~/helpers/scan";
import { BatchWriteItem, ScanResponse } from "@webiny/db-dynamodb";
import { IndexManager } from "~/settings";
import { IIndexManager } from "~/settings/types";

const getKeys = (results: ScanResponse): IElasticsearchIndexingTaskValuesKeys | undefined => {
    if (results.lastEvaluatedKey?.PK && results.lastEvaluatedKey?.SK) {
        return {
            PK: results.lastEvaluatedKey.PK as unknown as string,
            SK: results.lastEvaluatedKey.SK as unknown as string
        };
    }
    return undefined;
};

export class ReindexingTaskRunner {
    private readonly manager: IManager<IElasticsearchIndexingTaskValues>;
    private keys?: IElasticsearchIndexingTaskValuesKeys;

    private readonly indexManager: IIndexManager;
    private readonly response: ITaskResponse;

    public constructor(
        manager: IManager<IElasticsearchIndexingTaskValues>,
        indexManager: IndexManager
    ) {
        this.manager = manager;
        this.response = manager.response;
        this.indexManager = indexManager;
    }

    /**
     * When running the task, we always must check:
     * * if task is close to timeout
     * * if task was aborted
     */
    public async exec(
        keys: IElasticsearchIndexingTaskValuesKeys | undefined = undefined,
        limit: number
    ): Promise<ITaskResponseResult> {
        this.keys = keys;

        const isIndexAllowed = (index: string): boolean => {
            const input = this.manager.store.getInput();
            if (typeof input.matching !== "string" || !input.matching) {
                return true;
            }
            return index.includes(input.matching);
        };

        try {
            while (this.manager.isCloseToTimeout() === false) {
                if (this.manager.isAborted()) {
                    return this.response.aborted();
                }

                const results = await scan<IDynamoDbElasticsearchRecord>({
                    table: this.manager.table,
                    keys: this.keys,
                    options: {
                        limit
                    }
                });
                if (results.items.length === 0) {
                    await this.indexManager.enableIndexing();
                    return this.response.done("No more items to process.");
                }

                const batch: BatchWriteItem[] = [];
                for (const item of results.items) {
                    /**
                     * No index defined? Impossible but let's skip if really happens.
                     */
                    if (!item.index) {
                        continue;
                    }
                    if (isIndexAllowed(item.index) === false) {
                        continue;
                    }
                    const exists = await this.indexManager.indexExists(item.index);
                    if (!exists) {
                        await this.manager.store.addInfoLog({
                            message: `Index "${item.index}" does not exist. Skipping the item.`
                        });
                        continue;
                    }
                    /**
                     * Is there a possibility that entityName does not exist? What do we do at that point?
                     */
                    const entityName = item._et || item.entity;
                    /**
                     * Let's skip for now.
                     */
                    if (!entityName) {
                        continue;
                    }
                    const entity = this.manager.getEntity(entityName);
                    /**
                     * Disable the indexing for the current index.
                     * Method does nothing if indexing is already disabled.
                     */
                    await this.indexManager.disableIndexing(item.index);
                    /**
                     * Reindexing will be triggered by the `putBatch` method.
                     */
                    batch.push(
                        entity.putBatch({
                            ...item,
                            modified: new Date().toISOString()
                        })
                    );
                }
                await this.manager.write(batch);
                /**
                 * We always store the index settings, so we can restore them later.
                 * Also, we always want to store what was the last key we processed, just in case something breaks, so we can continue from this point.
                 */
                this.keys = getKeys(results);
                await this.manager.store.updateInput({
                    settings: this.indexManager.settings,
                    keys: this.keys
                });
                /**
                 * We want to make sure that, if there are no last evaluated keys, we enable indexing.
                 */
                if (!this.keys) {
                    await this.indexManager.enableIndexing();
                    return this.response.done("No more items to process - no last evaluated keys.");
                }
            }
            return this.response.continue({
                keys: this.keys
            });
        } catch (ex) {
            /**
             * We want to enable indexing if there was an error.
             */
            try {
                await this.indexManager.enableIndexing();
            } catch (er) {
                er.data = ex;
                return this.response.error(er);
            }
            return this.response.error(ex);
        }
    }
}
