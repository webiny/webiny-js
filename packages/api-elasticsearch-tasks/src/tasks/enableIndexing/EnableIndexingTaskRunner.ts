import type { IManager } from "~/types.js";
import type { ITaskResult } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IndexManager } from "~/settings/index.js";
import type { IIndexManager } from "~/settings/types.js";
import type { IElasticsearchEnableIndexingTaskInput } from "~/tasks/enableIndexing/types.js";

export class EnableIndexingTaskRunner {
    private readonly manager: IManager<IElasticsearchEnableIndexingTaskInput>;
    private readonly indexManager: IIndexManager;

    public constructor(
        manager: IManager<IElasticsearchEnableIndexingTaskInput>,
        indexManager: IndexManager
    ) {
        this.manager = manager;
        this.indexManager = indexManager;
    }

    public async exec(
        matching?: string
    ): Promise<ITaskResult<IElasticsearchEnableIndexingTaskInput>> {
        if (this.manager.controller.runtime.isAborted()) {
            return this.manager.controller.response.aborted();
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        const indexes = await this.indexManager.list();
        const enabled: string[] = [];
        const failed: string[] = [];
        for (const index of indexes) {
            if (!isIndexAllowed(index)) {
                continue;
            }
            try {
                await this.indexManager.enableIndexing(index);
                enabled.push(index);
            } catch (ex) {
                failed.push(index);
                await this.manager.controller.logger.error({
                    message: `Failed to enable indexing on index "${index}".`,
                    error: ex
                });
            }
        }
        return this.manager.controller.response.done("Task done.", {
            enabled,
            failed
        });
    }
}
