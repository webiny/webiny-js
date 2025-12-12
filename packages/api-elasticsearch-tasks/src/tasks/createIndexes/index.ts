import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";
import { createContextPlugin } from "@webiny/api";
import { getClients } from "~/helpers/getClients.js";
import { CreateIndexesTaskDefinition } from "~/tasks/createIndexes/CreateIndexesTask.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { OpensearchTenantIndexFactory } from "~/tasks/createIndexes/abstractions.js";

export const createIndexesTaskDefinition = (params?: Partial<IElasticsearchTaskConfig>) => {
    return createContextPlugin<Context>(async context => {
        const clients = getClients(context, params);

        // Register the task definition
        context.container.registerFactory(TaskDefinition, () => {
            const tenantContext = context.container.resolve(TenantContext);
            const listTenantsUseCase = context.container.resolve(ListTenantsUseCase);
            const indexFactories = context.container.resolveAll(OpensearchTenantIndexFactory);

            return new CreateIndexesTaskDefinition(
                clients.elasticsearchClient,
                clients.documentClient,
                tenantContext,
                listTenantsUseCase,
                indexFactories
            );
        });
    });
};
