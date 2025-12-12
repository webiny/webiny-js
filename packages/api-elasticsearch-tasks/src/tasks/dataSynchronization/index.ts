import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IElasticsearchTaskConfig } from "~/types.js";
import type {
    IDataSynchronizationInput,
    IDataSynchronizationOutput
} from "~/tasks/dataSynchronization/types.js";
import { createContextPlugin } from "@webiny/api";
import { DbRegistry } from "~/abstractions/index.js";

export const DATA_SYNCHRONIZATION_TASK = "dataSynchronization";

class DataSynchronizationTask
    implements TaskDefinition.Interface<IDataSynchronizationInput, IDataSynchronizationOutput>
{
    id = DATA_SYNCHRONIZATION_TASK;
    title = "Data Synchronization";
    description = "Synchronize data between Elasticsearch and DynamoDB";
    isPrivate = false;
    maxIterations = 100;
    disableDatabaseLogs = true;

    constructor(
        private config: IElasticsearchTaskConfig | undefined,
        private dbRegistry: DbRegistry.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IDataSynchronizationInput, IDataSynchronizationOutput>) {
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

        const manager = new Manager<IDataSynchronizationInput>({
            elasticsearchClient: this.config?.elasticsearchClient,
            documentClient: this.config?.documentClient,
            controller,
            dbRegistry: this.dbRegistry
        });

        const indexManager = new IndexManager(manager.elasticsearch, {});

        const { DataSynchronizationTaskRunner } = await import(
            /* webpackChunkName: "DataSynchronizationTaskRunner" */ "./DataSynchronizationTaskRunner.js"
        );

        const { createFactories } = await import(
            /* webpackChunkName: "createFactories" */ "./createFactories.js"
        );

        try {
            const dataSynchronization = new DataSynchronizationTaskRunner({
                manager,
                indexManager,
                factories: createFactories()
            });
            return await dataSynchronization.run({
                ...input
            });
        } catch (ex) {
            return controller.response.error(ex);
        }
    }

    createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
        return {
            flow: validator.enum(["elasticsearchToDynamoDb"]),
            elasticsearchToDynamoDb: validator
                .object({
                    finished: validator.boolean().optional().default(false),
                    index: validator.string().optional(),
                    cursor: validator.array(validator.string()).optional()
                })
                .optional()
                .default({
                    finished: false
                })
        };
    }
}

export const createDataSynchronization = (params?: IElasticsearchTaskConfig) => {
    return createContextPlugin(async context => {
        // Register the task definition with DbRegistry injected
        context.container.registerFactory(
            TaskDefinition,
            () => new DataSynchronizationTask(params, context.container.resolve(DbRegistry))
        );
    });
};
