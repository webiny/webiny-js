import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type {
    IDataSynchronizationInput,
    IDataSynchronizationOutput
} from "~/tasks/dataSynchronization/types.js";
import { ElasticsearchSynchronize } from "~/tasks/dataSynchronization/elasticsearch/abstractions/ElasticsearchSynchronize.js";
import { Manager } from "~/types.js";
import { IndexManager } from "~/settings/index.js";
import { DataSynchronizationTaskRunner } from "./DataSynchronizationTaskRunner.js";
import { createFactories } from "./createFactories.js";

export const DATA_SYNCHRONIZATION_TASK = "dataSynchronization";

class DataSynchronizationTaskImpl implements TaskDefinition.Interface<
    IDataSynchronizationInput,
    IDataSynchronizationOutput
> {
    public readonly id = DATA_SYNCHRONIZATION_TASK;
    public readonly title = "Data Synchronization";
    public readonly description = "Synchronize data between Elasticsearch and DynamoDB";
    public readonly isPrivate = false;
    public readonly maxIterations = 100;
    public readonly databaseLogs = false;

    constructor(
        private readonly manager: Manager.Interface,
        private readonly elasticsearchSynchronize: ElasticsearchSynchronize.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IDataSynchronizationInput, IDataSynchronizationOutput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = new IndexManager(this.manager.elasticsearch, {});

        try {
            const dataSynchronization = new DataSynchronizationTaskRunner({
                manager: this.manager,
                indexManager,
                factories: createFactories(),
                elasticsearchSynchronize: this.elasticsearchSynchronize
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

export const DataSynchronizationTask = TaskDefinition.createImplementation({
    implementation: DataSynchronizationTaskImpl,
    dependencies: [Manager, ElasticsearchSynchronize]
});
