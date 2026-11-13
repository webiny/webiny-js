import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ensureCanTriggerSystemTask } from "~/tasks/ensureCanTriggerSystemTask.js";
import type { IElasticsearchIndexingTaskValues } from "~/types.js";
import { ReindexingTaskRunner } from "./abstractions/ReindexingTaskRunner.js";
import { IndexManagerFactory } from "~/settings/abstractions/IndexManagerFactory.js";

class ElasticsearchReindexingTaskImpl implements TaskDefinition.Interface<IElasticsearchIndexingTaskValues> {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Elasticsearch reindexing";

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: ReindexingTaskRunner.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<IElasticsearchIndexingTaskValues>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: input.settings || {}
        });

        const keys = input.keys || undefined;
        return await this.runner.exec(keys, input.limit || 100, indexManager);
    }

    async onBeforeTrigger({
        data
    }: TaskDefinition.BeforeTriggerParams<IElasticsearchIndexingTaskValues>) {
        await ensureCanTriggerSystemTask({
            identityContext: this.identityContext,
            tenantContext: this.tenantContext
        });
        /**
         * Security: index settings are internal state the task stores while it runs.
         * Never take them from the caller.
         */
        delete data.input.settings;
    }
}

export const ElasticsearchReindexingTask = TaskDefinition.createImplementation({
    implementation: ElasticsearchReindexingTaskImpl,
    dependencies: [IndexManagerFactory, ReindexingTaskRunner, IdentityContext, TenantContext]
});
