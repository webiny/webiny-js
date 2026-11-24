import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ensureCanTriggerSystemTask } from "~/tasks/ensureCanTriggerSystemTask.js";
import { CreateIndexesRunner } from "./abstractions/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "./abstractions/OnBeforeTrigger.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class CreateIndexesTaskHandlerImpl implements TaskHandler.Interface<CreateIndexesRunner.Input> {
    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: CreateIndexesRunner.Interface,
        private readonly onBeforeTriggerRunner: OnBeforeTrigger.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<CreateIndexesRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {}
        });

        return this.runner.execute(input.matching, Array.from(input.done || []), indexManager);
    }

    async onBeforeTrigger() {
        await ensureCanTriggerSystemTask({
            identityContext: this.identityContext,
            tenantContext: this.tenantContext
        });

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {}
        });

        await this.onBeforeTriggerRunner.run(["wbytask"], indexManager);
    }
}

const CreateIndexesTaskHandler = TaskHandler.createImplementation({
    implementation: CreateIndexesTaskHandlerImpl,
    dependencies: [
        IndexManagerFactory,
        CreateIndexesRunner,
        OnBeforeTrigger,
        IdentityContext,
        TenantContext
    ]
});

class CreateIndexesTaskImpl implements TaskDefinition.Interface {
    public readonly id = "elasticsearchCreateIndexes";
    public readonly title = "Create Missing Search Indexes";
    public readonly maxIterations = 2;

    handler = CreateIndexesTaskHandler;
}

export const CreateIndexesTask = TaskDefinition.createImplementation({
    implementation: CreateIndexesTaskImpl,
    dependencies: []
});
