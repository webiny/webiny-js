import {
    IDataSynchronizationInput,
    IDataSynchronizationManager,
    IFactories
} from "~/tasks/dataSynchronization/types";
import { IIndexManager } from "~/settings/types";

export interface IDataSynchronizationTaskRunnerParams {
    manager: IDataSynchronizationManager;
    indexManager: IIndexManager;
    factories: IFactories;
}

export class DataSynchronizationTaskRunner {
    private readonly manager: IDataSynchronizationManager;
    private readonly indexManager: IIndexManager;
    private readonly factories: IFactories;

    public constructor(params: IDataSynchronizationTaskRunnerParams) {
        this.manager = params.manager;
        this.indexManager = params.indexManager;
        this.factories = params.factories;
    }

    public async run(input: IDataSynchronizationInput) {
        /**
         * First we check if we need to sync Elasticsearch.
         */
        //
        if (!input.elasticsearch?.finished) {
            const sync = this.factories.createElasticsearch({
                manager: this.manager,
                indexManager: this.indexManager
            });
            try {
                return await sync.run(input);
            } catch (ex) {
                return this.manager.response.error(ex);
            }
        }
        /**
         * Then we go through the DynamoDB to Elasticsearch table.
         */
        //
        else if (!input.dynamoDbElasticsearch?.finished) {
            const sync = this.factories.createDynamoDbElasticsearch({
                manager: this.manager
            });
            try {
                return await sync.run(input);
            } catch (ex) {
                return this.manager.response.error(ex);
            }
        }
        /**
         * Then we will go through the DynamoDB.
         */
        //
        else if (!input.dynamoDb?.finished) {
            const sync = this.factories.createDynamoDb({
                manager: this.manager
            });
            try {
                return await sync.run(input);
            } catch (ex) {
                return this.manager.response.error(ex);
            }
        }
        /**
         * If we reach this point, something went wrong.
         */
        return this.manager.response.error("Should not reach this point.");
    }
}
