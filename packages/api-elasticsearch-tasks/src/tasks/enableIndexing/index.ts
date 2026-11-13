import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ensureCanTriggerSystemTask } from "~/tasks/ensureCanTriggerSystemTask.js";
import type { IElasticsearchEnableIndexingTaskInput } from "./types.js";
import { EnableIndexingTaskRunner } from "./abstractions/EnableIndexingTaskRunner.js";
import { IndexManagerFactory } from "~/settings/abstractions/IndexManagerFactory.js";

class ElasticsearchEnableIndexingTaskImpl implements TaskDefinition.Interface<IElasticsearchEnableIndexingTaskInput> {
    public readonly id = "elasticsearchEnableIndexing";
    public readonly title = "Enable Indexing on Elasticsearch Indexes";

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: EnableIndexingTaskRunner.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchEnableIndexingTaskInput>) {
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

        return this.runner.exec(input.matching, indexManager);
    }

    async onBeforeTrigger() {
        await ensureCanTriggerSystemTask({
            identityContext: this.identityContext,
            tenantContext: this.tenantContext
        });
    }
}

export const ElasticsearchEnableIndexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchEnableIndexingTaskImpl,
    dependencies: [IndexManagerFactory, EnableIndexingTaskRunner, IdentityContext, TenantContext]
});

export { EnableIndexingTaskRunner } from "./EnableIndexingTaskRunner.js";
