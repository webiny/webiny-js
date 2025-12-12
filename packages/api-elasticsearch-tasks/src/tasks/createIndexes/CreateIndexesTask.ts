import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchCreateIndexesTaskInput } from "~/tasks/createIndexes/types.js";
import type { IElasticsearchTaskConfig } from "~/types.js";
import { CreateIndexesTaskRunner } from "~/tasks/createIndexes/CreateIndexesTaskRunner.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { OpensearchTenantIndexFactory } from "~/tasks/createIndexes/abstractions.js";

export class CreateIndexesTaskDefinition
    implements TaskDefinition.Interface<IElasticsearchCreateIndexesTaskInput>
{
    id = "elasticsearchCreateIndexes";
    title = "Create Missing Elasticsearch Indexes";
    /**
     * Maximum number of iterations before the task goes into the error state.
     * No point in having more than 2 runs, as the create index operations should not even take 1 full run, no matter how much indexes is there to create.
     */
    maxIterations = 2;

    constructor(
        private elasticsearchClient: IElasticsearchTaskConfig["elasticsearchClient"],
        private documentClient: IElasticsearchTaskConfig["documentClient"],
        private tenantContext: TenantContext.Interface,
        private listTenantsUseCase: ListTenantsUseCase.Interface,
        private indexFactories: OpensearchTenantIndexFactory.Interface[]
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IElasticsearchCreateIndexesTaskInput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const { Manager } = await import(
            /* webpackChunkName: "Manager" */
            "../Manager.js"
        );
        const { IndexManager } = await import(
            /* webpackChunkName: "IndexManager" */ "~/settings/index.js"
        );

        const manager = new Manager<IElasticsearchCreateIndexesTaskInput>({
            elasticsearchClient: this.elasticsearchClient,
            documentClient: this.documentClient,
            controller
        });

        const indexManager = new IndexManager(manager.elasticsearch, {});

        const createIndexesTaskRunner = new CreateIndexesTaskRunner(
            this.tenantContext,
            this.listTenantsUseCase,
            this.indexFactories,
            manager,
            indexManager
        );

        return createIndexesTaskRunner.execute(input.matching, Array.from(input.done || []));
    }

    async onBeforeTrigger() {
        // Let's create a new index for the tasks first.
        const { IndexManager } = await import(
            /* webpackChunkName: "IndexManager" */ "~/settings/index.js"
        );
        const indexManager = new IndexManager(this.elasticsearchClient, {});
        const { OnBeforeTrigger } = await import(
            /* webpackChunkName: "OnBeforeTrigger" */
            "./OnBeforeTrigger.js"
        );

        const onBeforeTrigger = new OnBeforeTrigger(
            indexManager,
            this.tenantContext,
            this.indexFactories
        );
        await onBeforeTrigger.run(["webinytask"]);
    }
}
