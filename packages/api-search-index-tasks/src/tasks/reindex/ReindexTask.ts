import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ReindexRunner } from "./abstractions/ReindexRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class ReindexTaskHandlerImpl implements TaskHandler.Interface<ReindexRunner.Input> {
    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: ReindexRunner.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<ReindexRunner.Input>) {
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

const ReindexTaskHandler = TaskHandler.createImplementation({
    implementation: ReindexTaskHandlerImpl,
    dependencies: [IndexManagerFactory, ReindexRunner]
});

class ReindexTaskImpl implements TaskDefinition.Interface {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Reindex Search Index";
    public readonly maxIterations = 500;

    handler = ReindexTaskHandler;
}

export const ReindexTask = TaskDefinition.createImplementation({
    implementation: ReindexTaskImpl,
    dependencies: []
});
