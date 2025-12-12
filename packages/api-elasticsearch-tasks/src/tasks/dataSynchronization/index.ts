import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";
import { createContextPlugin } from "@webiny/api";
import { DataSynchronizationTask } from "./DataSynchronizationTask.js";
import { getClients } from "~/helpers/getClients.js";
import { ElasticsearchSynchronize } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { DbRegistry } from "~/abstractions/DbRegistry.js";
import { SynchronizationContext } from "~/abstractions/SynchronizationContext.js";

export { DATA_SYNCHRONIZATION_TASK } from "./DataSynchronizationTask.js";

export const createDataSynchronization = (params?: Partial<IElasticsearchTaskConfig>) => {
    return createContextPlugin<Context>(async context => {
        const { documentClient, elasticsearchClient } = getClients(context, params);

        // Register the task definition with DbRegistry injected
        context.container.registerFactory(TaskDefinition, () => {
            const elasticsearchSynchronize = context.container.resolveWithDependencies({
                implementation: ElasticsearchSynchronize,
                dependencies: [TaskController, DbRegistry, SynchronizationContext]
            });

            return new DataSynchronizationTask(
                elasticsearchClient,
                documentClient,
                elasticsearchSynchronize
            );
        });
    });
};
