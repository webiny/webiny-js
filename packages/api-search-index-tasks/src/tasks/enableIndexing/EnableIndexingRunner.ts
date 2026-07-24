import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { EnableIndexingRunner as Abstraction } from "./abstractions/EnableIndexingRunner.js";

class EnableIndexingRunnerImpl implements Abstraction.Interface {
    constructor(private readonly controller: TaskController.Interface) {}

    public async exec(
        matching: string | undefined,
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result<Abstraction.Input>> {
        if (this.controller.runtime.isAborted()) {
            return this.controller.response.aborted();
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
                await this.controller.logger.error({
                    message: `Failed to enable indexing on index "${index}".`,
                    error: ex
                });
            }
        }
        return this.controller.response.done("Task done.", {
            enabled,
            failed
        });
    }
}

export const EnableIndexingRunner = Abstraction.createImplementation({
    implementation: EnableIndexingRunnerImpl,
    dependencies: [TaskController]
});
