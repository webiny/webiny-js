import type { IIndexManager } from "~/abstractions/IndexManager.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TenantIndexFactory } from "~/abstractions/TenantIndexFactory.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { listIndexes } from "./listIndexes.js";
import { createIndexFactory } from "./createIndexFactory.js";
import { CreateIndexesRunner as Abstraction } from "./abstractions/CreateIndexesRunner.js";

class CreateIndexesRunnerImpl implements Abstraction.Interface {
    constructor(
        private readonly controller: TaskController.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTenantsUseCase: ListTenantsUseCase.Interface,
        private readonly indexFactories: TenantIndexFactory.Interface[]
    ) {}

    public async execute(
        matching: string | undefined,
        done: string[],
        indexManager: IIndexManager
    ): Promise<TaskDefinition.Result> {
        if (this.indexFactories.length === 0) {
            return this.controller.response.done("No index plugins found.");
        }

        const tenantsResult = await this.listTenantsUseCase.execute();
        const tenants = tenantsResult.value;

        const indexes = await listIndexes(this.tenantContext, tenants, this.indexFactories);

        if (indexes.length === 0) {
            return this.controller.response.done("No indexes found.");
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        const factory = createIndexFactory(indexManager);

        for (const { index, settings } of indexes) {
            if (this.controller.runtime.isAborted()) {
                return this.controller.response.aborted();
            } else if (this.controller.runtime.isCloseToTimeout()) {
                return this.controller.response.continue({
                    done
                });
            }
            try {
                if (done.includes(index)) {
                    continue;
                } else if (isIndexAllowed(index) === false) {
                    continue;
                }
                const exists = await indexManager.indexExists(index);
                if (exists) {
                    continue;
                }
                done.push(index);
                await factory.create(index, settings);
                await this.controller.logger.info({
                    message: `Index "${index}" created.`,
                    data: { index }
                });
            } catch (ex) {
                await this.controller.logger.error({
                    message: `Failed to create index "${index}".`,
                    error: ex
                });
            }
        }

        return this.controller.response.done("Indexes created.", {
            done
        });
    }
}

export const CreateIndexesRunner = Abstraction.createImplementation({
    implementation: CreateIndexesRunnerImpl,
    dependencies: [
        TaskController,
        TenantContext,
        ListTenantsUseCase,
        [TenantIndexFactory, { multiple: true }]
    ]
});
