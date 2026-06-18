import type {
    IDynamoDbElasticsearchRecord,
    IElasticsearchIndexingTaskValues,
    IElasticsearchIndexingTaskValuesKeys,
    Manager
} from "~/types.js";
import type { ITaskResult } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { scan } from "~/helpers/scan.js";
import type { ScanResponse } from "@webiny/db-dynamodb";
import { createTableWriteBatch } from "@webiny/db-dynamodb";
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
    private readonly manager: Manager.Interface;
    private keys?: IElasticsearchIndexingTaskValuesKeys;
    private readonly indexManager: IIndexManager;

    public constructor(manager: Manager.Interface, indexManager: IIndexManager) {
        this.manager = manager;
        this.indexManager = indexManager;
    }

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
                    table: this.manager.table.table,
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
                    table: this.manager.table.table
                });

                for (const item of results.items) {
                    if (!item.index) {
                        continue;
                    }
                    if (isIndexAllowed(item.index) === false) {
                        continue;
                    }
                    const exists = await this.indexManager.indexExists(item.index);
                    if (!exists) {
                        await this.manager.controller.logger.info({
                            message: `Index "${item.index}" does not exist. Skipping the item.`
                        });
                        continue;
                    }
                    const entityName = item._et || item.entity;
                    if (!entityName) {
                        continue;
                    }
                    const entity = this.manager.getEntity(entityName);
                    await this.indexManager.disableIndexing(item.index);
                    tableWriteBatch.put(entity.entity, {
                        ...item,
                        TYPE: item.TYPE || "unknown",
                        modified: new Date().toISOString()
                    });
                }
                await tableWriteBatch.execute();
                this.keys = getKeys(results);
                await this.manager.controller.state.updateInput({
                    settings: this.indexManager.settings,
                    keys: this.keys
                });
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
