import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { ReindexRunner } from "./abstractions/ReindexRunner.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";
import { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";

class ReindexTaskImpl implements TaskDefinition.Interface<ReindexRunner.Input> {
    public readonly id = "elasticsearchReindexing";
    public readonly title = "Reindex Search Index";
    public readonly maxIterations = 500;

    constructor(
        private readonly indexManagerFactory: IndexManagerFactory.Interface,
        private readonly runner: ReindexRunner.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTenantsUseCase: ListTenantsUseCase.Interface,
        private readonly indexFactories: TenantIndexFactory.Interface[]
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<ReindexRunner.Input>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = this.indexManagerFactory.createIndexManager({
            settings: input.settings || {}
        });

        const indexConfigs = await this.buildIndexConfigs();
        const cursor = input.cursor || undefined;
        return await this.runner.execute(cursor, input.limit || 100, indexManager, indexConfigs);
    }

    private async buildIndexConfigs(): Promise<ReindexRunner.IndexConfigsMap> {
        const configs: ReindexRunner.IndexConfigsMap = {};
        const tenantsResult = await this.listTenantsUseCase.execute();
        const tenants = tenantsResult.value;

        await this.tenantContext.withEachTenant(tenants, async tenant => {
            for (const factory of this.indexFactories) {
                const results = await factory.getIndexList(tenant);
                for (const result of results) {
                    if (!configs[result.index]) {
                        configs[result.index] = result;
                    }
                }
            }
        });

        return configs;
    }
}

export const ReindexTask = TaskDefinition.createImplementation({
    implementation: ReindexTaskImpl,
    dependencies: [
        IndexManagerFactory,
        ReindexRunner,
        TenantContext,
        ListTenantsUseCase,
        [TenantIndexFactory, { multiple: true }]
    ]
});
