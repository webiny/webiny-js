import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ReindexRunner } from "./abstractions/ReindexRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class ReindexTaskImpl implements TaskDefinition.Interface<ReindexRunner.Input> {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Reindex Search Index";
    public readonly maxIterations = 500;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: ReindexRunner.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<ReindexRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: input.settings || {}
        });

        const cursor = input.cursor || undefined;
        return await this.runner.execute(cursor, input.limit || 100, indexManager);
    }
}

export const ReindexTask = TaskDefinition.createImplementation({
    implementation: ReindexTaskImpl,
    dependencies: [IndexManagerFactory, ReindexRunner]
});
