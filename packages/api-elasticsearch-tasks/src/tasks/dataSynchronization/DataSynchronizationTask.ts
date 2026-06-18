import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type {
    IDataSynchronizationInput,
    IDataSynchronizationOutput
} from "~/tasks/dataSynchronization/types.js";
import { Manager } from "~/types.js";
import { IndexManager } from "~/settings/index.js";
import { DisableIndexing } from "~/settings/abstractions/DisableIndexing.js";
import { EnableIndexing } from "~/settings/abstractions/EnableIndexing.js";
import { ElasticsearchToDynamoDbSynchronization } from "./elasticsearch/abstractions/ElasticsearchToDynamoDbSynchronization.js";

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
        private readonly disableIndexing: DisableIndexing.Interface,
        private readonly enableIndexing: EnableIndexing.Interface,
        private readonly sync: ElasticsearchToDynamoDbSynchronization.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IDataSynchronizationInput, IDataSynchronizationOutput>) {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const indexManager = new IndexManager(
            this.manager.elasticsearch,
            this.disableIndexing,
            this.enableIndexing,
            {}
        );

        try {
            return await this.sync.run(input, indexManager);
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
    dependencies: [Manager, DisableIndexing, EnableIndexing, ElasticsearchToDynamoDbSynchronization]
});
