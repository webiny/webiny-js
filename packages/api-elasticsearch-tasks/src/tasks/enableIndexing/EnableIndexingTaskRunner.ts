import { IManager } from "~/types";
import { ITaskResponse, ITaskResponseResult } from "@webiny/tasks/response/abstractions";
import { IndexManager } from "~/settings";
import { IIndexManager } from "~/settings/types";
import { IElasticsearchEnableIndexingTaskInput } from "~/tasks/enableIndexing/types";

export class EnableIndexingTaskRunner {
    private readonly manager: IManager<IElasticsearchEnableIndexingTaskInput>;
    private readonly indexManager: IIndexManager;
    private readonly response: ITaskResponse;

    public constructor(
        manager: IManager<IElasticsearchEnableIndexingTaskInput>,
        indexManager: IndexManager
    ) {
        this.manager = manager;
        this.response = manager.response;
        this.indexManager = indexManager;
    }

    public async exec(matching?: string): Promise<ITaskResponseResult> {
        if (this.manager.isAborted()) {
            return this.response.aborted();
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
                await this.manager.store.addErrorLog({
                    message: `Failed to enable indexing on index "${index}".`,
                    error: ex
                });
            }
        }
        return this.response.done("Task done.", {
            enabled,
            failed
        });
    }
}
