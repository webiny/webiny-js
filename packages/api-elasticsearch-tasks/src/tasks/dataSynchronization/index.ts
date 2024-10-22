import { createTaskDefinition } from "@webiny/tasks";
import { Context, IElasticsearchTaskConfig } from "~/types";
import { IDataSynchronizationInput } from "~/tasks/dataSynchronization/types";

export const DATA_SYNCHRONIZATION_TASK = "dataSynchronization";

export const createDataSynchronization = (params?: IElasticsearchTaskConfig) => {
    return createTaskDefinition<Context, IDataSynchronizationInput>({
        id: DATA_SYNCHRONIZATION_TASK,
        isPrivate: false,
        title: "Data Synchronization",
        description: "Synchronize data between Elasticsearch and DynamoDB",
        maxIterations: 50,
        disableDatabaseLogs: true,
        async run({ context, response, isCloseToTimeout, isAborted, store, input, timer }) {
            const { Manager } = await import(
                /* webpackChunkName: "Manager" */
                "../Manager"
            );

            const { IndexManager } = await import(
                /* webpackChunkName: "IndexManager" */ "~/settings"
            );

            const manager = new Manager<IDataSynchronizationInput>({
                elasticsearchClient: params?.elasticsearchClient,
                documentClient: params?.documentClient,
                response,
                context,
                isAborted,
                isCloseToTimeout,
                store,
                timer
            });

            const indexManager = new IndexManager(manager.elasticsearch, {});

            const { DataSynchronizationTaskRunner } = await import(
                /* webpackChunkName: "DataSynchronizationTaskRunner" */ "./DataSynchronizationTaskRunner"
            );

            const { createFactories } = await import(
                /* webpackChunkName: "createFactories" */ "./createFactories"
            );

            try {
                const dataSynchronization = new DataSynchronizationTaskRunner({
                    manager,
                    indexManager,
                    factories: createFactories()
                });
                return await dataSynchronization.run(input);
            } catch (ex) {
                return response.error(ex);
            }
        }
    });
};
