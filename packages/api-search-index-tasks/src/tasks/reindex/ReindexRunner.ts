import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { StorageScanner } from "~/abstractions/StorageScanner.js";
import { StorageWriter } from "~/abstractions/StorageWriter.js";
import { ReindexRunner as Abstraction } from "./abstractions/ReindexRunner.js";

class ReindexRunnerImpl implements Abstraction.Interface {
    constructor(
        private readonly controller: TaskController.Interface,
        private readonly scanner: StorageScanner.Interface,
        private readonly writer: StorageWriter.Interface
    ) {}

    public async exec(
        cursor: string | undefined,
        limit: number,
        indexManager: IIndexManager,
        indexConfigs: Abstraction.IndexConfigsMap
    ): Promise<TaskDefinition.Result<Abstraction.Input>> {
        const isIndexAllowed = (index: string): boolean => {
            const input = this.controller.state.getInput();
            if (typeof input.matching !== "string" || !input.matching) {
                return true;
            }
            return index.includes(input.matching);
        };

        try {
            while (this.controller.runtime.isCloseToTimeout() === false) {
                if (this.controller.runtime.isAborted()) {
                    return this.controller.response.aborted();
                }

                const results = await this.scanner.scan(cursor, limit);
                if (results.items.length === 0) {
                    await indexManager.enableIndexing();
                    return this.controller.response.done("No more items to process.");
                }

                for (const item of results.items) {
                    if (!item.index) {
                        continue;
                    }
                    if (isIndexAllowed(item.index) === false) {
                        continue;
                    }
                    if (!item.entity) {
                        continue;
                    }

                    const exists = await indexManager.indexExists(item.index);
                    if (!exists) {
                        const config = indexConfigs[item.index];
                        if (!config) {
                            await this.controller.logger.info({
                                message: `Index "${item.index}" does not exist and no configuration found. Skipping.`
                            });
                            continue;
                        }
                        await indexManager.createIndex(item.index, config.settings);
                        await this.controller.logger.info({
                            message: `Index "${item.index}" created.`
                        });
                    }

                    await indexManager.disableIndexing(item.index);
                    this.writer.put({
                        entity: item.entity,
                        data: {
                            ...item.data,
                            modified: new Date().toISOString()
                        }
                    });
                }
                await this.writer.execute();
                cursor = results.cursor;
                await this.controller.state.updateInput({
                    settings: indexManager.settings,
                    cursor
                });
                if (!cursor) {
                    await indexManager.enableIndexing();
                    return this.controller.response.done(
                        "No more items to process - no last evaluated keys."
                    );
                }
            }
            return this.controller.response.continue({
                cursor
            });
        } catch (ex) {
            try {
                await indexManager.enableIndexing();
            } catch (er) {
                er.data = ex;
                return this.controller.response.error(er);
            }
            return this.controller.response.error(ex);
        }
    }
}

export const ReindexRunner = Abstraction.createImplementation({
    implementation: ReindexRunnerImpl,
    dependencies: [TaskController, StorageScanner, StorageWriter]
});
