import type { IIndexManager } from "~/settings/types.js";
import { Manager } from "~/types.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchEnableIndexingTaskInput } from "~/tasks/enableIndexing/types.js";
import { EnableIndexingTaskRunner as Abstraction } from "./abstractions/EnableIndexingTaskRunner.js";

class EnableIndexingTaskRunnerImpl implements Abstraction.Interface {
    constructor(private readonly manager: Manager.Interface) {}

    public async exec(
        matching: string | undefined,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<IElasticsearchEnableIndexingTaskInput>> {
        if (this.manager.controller.runtime.isAborted()) {
            return this.manager.controller.response.aborted();
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        const indexes = await indexManager.list();
        const enabled: string[] = [];
        const failed: string[] = [];
        for (const index of indexes) {
            if (!isIndexAllowed(index)) {
                continue;
            }
            try {
                await indexManager.enableIndexing(index);
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

export const EnableIndexingTaskRunner = Abstraction.createImplementation({
    implementation: EnableIndexingTaskRunnerImpl,
    dependencies: [Manager]
});
