import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ensureCanTriggerSystemTask } from "~/tasks/ensureCanTriggerSystemTask.js";
import { EnableIndexingRunner } from "./abstractions/EnableIndexingRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";

class EnableIndexingTaskHandlerImpl implements TaskHandler.Interface<EnableIndexingRunner.Input> {
    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: EnableIndexingRunner.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<EnableIndexingRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: {},
            defaults: {
                refreshInterval: input.refreshInterval,
                numberOfReplicas: input.numberOfReplicas
            }
        });

        return this.runner.execute(input.matching, indexManager);
    }

    async onBeforeTrigger() {
        await ensureCanTriggerSystemTask({
            identityContext: this.identityContext,
            tenantContext: this.tenantContext
        });
    }
}

const EnableIndexingTaskHandler = TaskHandler.createImplementation({
    implementation: EnableIndexingTaskHandlerImpl,
    dependencies: [IndexManagerFactory, EnableIndexingRunner, IdentityContext, TenantContext]
});

class EnableIndexingTaskImpl implements TaskDefinition.Interface {
    public readonly id = "elasticsearchEnableIndexing";
    public readonly title = "Enable Search Indexing";
    public readonly maxIterations = 2;

    handler = EnableIndexingTaskHandler;
}

export const EnableIndexingTask = TaskDefinition.createImplementation({
    implementation: EnableIndexingTaskImpl,
    dependencies: []
});
