import type { IIndexManager } from "~/settings/types.js";
import { Manager } from "~/abstractions/Manager.js";
import { listIndexes } from "./listIndexes.js";
import { createIndexFactory } from "./createIndex.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { OpenSearchTenantIndexFactory } from "~/abstractions/OpenSearchTenantIndexFactory.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { CreateIndexesTaskRunner as Abstraction } from "./abstractions/CreateIndexesTaskRunner.js";

class CreateIndexesTaskRunnerImpl implements Abstraction.Interface {
    private readonly controller;

    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTenantsUseCase: ListTenantsUseCase.Interface,
        private readonly indexFactories: OpenSearchTenantIndexFactory.Interface[],
        manager: Manager.Interface
    ) {
        this.controller = manager.controller;
    }

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

        const createIndex = createIndexFactory(indexManager);

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
                await createIndex.create(index, settings);
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

export const CreateIndexesTaskRunner = Abstraction.createImplementation({
    implementation: CreateIndexesTaskRunnerImpl,
    dependencies: [
        TenantContext,
        ListTenantsUseCase,
        [OpenSearchTenantIndexFactory, { multiple: true }],
        Manager
    ]
});
