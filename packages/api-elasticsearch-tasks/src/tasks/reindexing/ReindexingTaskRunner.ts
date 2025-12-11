import type {
    IDynamoDbElasticsearchRecord,
    IElasticsearchIndexingTaskValues,
    IElasticsearchIndexingTaskValuesKeys,
    IManager
} from "~/types.js";
import type { ITaskResult } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { scan } from "~/helpers/scan.js";
import type { ScanResponse } from "@webiny/db-dynamodb";
import { createTableWriteBatch } from "@webiny/db-dynamodb";
import type { IndexManager } from "~/settings/index.js";
import type { IIndexManager } from "~/settings/types.js";

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

    public constructor(
        manager: IManager<IElasticsearchIndexingTaskValues>,
        indexManager: IndexManager
    ) {
        this.manager = manager;
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
    ): Promise<ITaskResult<IElasticsearchIndexingTaskValues>> {
        this.keys = keys;

        const isIndexAllowed = (index: string): boolean => {
            const input = this.manager.controller.state.getInput();
            if (typeof input.matching !== "string" || !input.matching) {
                return true;
            }
            return index.includes(input.matching);
        };

        try {
            while (this.manager.controller.runtime.isCloseToTimeout() === false) {
                if (this.manager.controller.runtime.isAborted()) {
                    return this.manager.controller.response.aborted();
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
                    return this.manager.controller.response.done("No more items to process.");
                }

                const tableWriteBatch = createTableWriteBatch({
                    table: this.manager.table
                });

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
                        await this.manager.controller.logger.info(
                            `Index "${item.index}" does not exist. Skipping the item.`
                        );
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
                    tableWriteBatch.put(entity.entity, {
                        ...item,
                        TYPE: item.TYPE || "unknown",
                        modified: new Date().toISOString()
                    });
                }
                await tableWriteBatch.execute();
                /**
                 * We always store the index settings, so we can restore them later.
                 * Also, we always want to store what was the last key we processed, just in case something breaks, so we can continue from this point.
                 */
                this.keys = getKeys(results);
                await this.manager.controller.state.updateInput({
                    settings: this.indexManager.settings,
                    keys: this.keys
                });
                /**
                 * We want to make sure that, if there are no last evaluated keys, we enable indexing.
                 */
                if (!this.keys) {
                    await this.indexManager.enableIndexing();
                    return this.manager.controller.response.done(
                        "No more items to process - no last evaluated keys."
                    );
                }
            }
            return this.manager.controller.response.continue({
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
                return this.manager.controller.response.error(er);
            }
            return this.manager.controller.response.error(ex);
        }
    }
}
