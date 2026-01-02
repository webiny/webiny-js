import type { Manager } from "~/tasks/Manager.js";
import type { IndexManager } from "~/settings/index.js";
import type { IElasticsearchCreateIndexesTaskInput } from "./types.js";
import { listIndexes } from "./listIndexes.js";
import { createIndexFactory } from "./createIndex.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { OpensearchTenantIndexFactory } from "~/abstractions/OpensearchTenantIndexFactory.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";

export class CreateIndexesTaskRunner {
    private taskController: TaskController.Interface;

    public constructor(
        private tenantContext: TenantContext.Interface,
        private listTenantsUseCase: ListTenantsUseCase.Interface,
        private indexFactories: OpensearchTenantIndexFactory.Interface[],
        manager: Manager<IElasticsearchCreateIndexesTaskInput>,
        private indexManager: IndexManager
    ) {
        this.taskController = manager.controller;
    }

    public async execute(
        matching: string | undefined,
        done: string[]
    ): Promise<TaskDefinition.Result> {
        if (this.indexFactories.length === 0) {
            return this.taskController.response.done("No index plugins found.");
        }

        const tenantsResult = await this.listTenantsUseCase.execute();
        const tenants = tenantsResult.value;

        const indexes = await listIndexes(this.tenantContext, tenants, this.indexFactories);

        if (indexes.length === 0) {
            return this.taskController.response.done("No indexes found.");
        }

        const isIndexAllowed = (index: string): boolean => {
            if (typeof matching !== "string" || !matching) {
                return true;
            }
            return index.includes(matching);
        };

        const createIndex = createIndexFactory(this.indexManager);

        for (const { index, settings } of indexes) {
            if (this.taskController.runtime.isAborted()) {
                return this.taskController.response.aborted();
            } else if (this.taskController.runtime.isCloseToTimeout()) {
                return this.taskController.response.continue({
                    done
                });
            }
            try {
                if (done.includes(index)) {
                    continue;
                } else if (isIndexAllowed(index) === false) {
                    continue;
                }
                const exists = await this.indexManager.indexExists(index);
                if (exists) {
                    continue;
                }
                done.push(index);
                await createIndex.create(index, settings);
                await this.taskController.logger.info({
                    message: `Index "${index}" created.`,
                    data: { index }
                });
            } catch (ex) {
                await this.taskController.logger.error({
                    message: `Failed to create index "${index}".`,
                    error: ex
                });
            }
        }

        return this.taskController.response.done("Indexes created.", {
            done
        });
    }
}
