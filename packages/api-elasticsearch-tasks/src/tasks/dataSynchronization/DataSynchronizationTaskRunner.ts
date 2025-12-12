import type {
    IDataSynchronizationInput,
    IDataSynchronizationManager,
    IFactories
} from "~/tasks/dataSynchronization/types.js";
import type { IIndexManager } from "~/settings/types.js";
import { ElasticsearchSynchronize } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.js";
import { ElasticsearchFetcher } from "~/tasks/dataSynchronization/elasticsearch/ElasticsearchFetcher.js";

export interface IDataSynchronizationTaskRunnerParams {
    manager: IDataSynchronizationManager;
    indexManager: IIndexManager;
    factories: IFactories;
    elasticsearchSynchronize: ElasticsearchSynchronize;
}

export class DataSynchronizationTaskRunner {
    private readonly manager: IDataSynchronizationManager;
    private readonly indexManager: IIndexManager;
    private readonly factories: IFactories;
    private readonly elasticsearchSynchronize: ElasticsearchSynchronize;

    public constructor(params: IDataSynchronizationTaskRunnerParams) {
        this.manager = params.manager;
        this.indexManager = params.indexManager;
        this.factories = params.factories;
        this.elasticsearchSynchronize = params.elasticsearchSynchronize
    }

    public async run(input: IDataSynchronizationInput) {
        this.validateFlow(input);
        /**
         * Go through the Elasticsearch and delete records which do not exist in the Elasticsearch table.
         */
        //
        if (input.flow === "elasticsearchToDynamoDb" && !input.elasticsearchToDynamoDb?.finished) {
            if (!this.manager.dbRegistry) {
                return this.manager.controller.response.error(
                    "DbRegistry is required for data synchronization but was not provided to Manager"
                );
            }

            const sync = this.factories.elasticsearchToDynamoDb({
                manager: this.manager,
                indexManager: this.indexManager,
                synchronize: this.elasticsearchSynchronize,
                fetcher: new ElasticsearchFetcher({
                    client: this.manager.elasticsearch
                })
            });
            try {
                return await sync.run(input);
            } catch (ex) {
                return this.manager.controller.response.error(ex);
            }
        }
        /**
         * We are done.
         */
        return this.manager.controller.response.done();
    }

    private validateFlow(input: IDataSynchronizationInput): void {
        if (!input.flow) {
            throw new Error(`Missing "flow" in the input.`);
        } else if (this.factories[input.flow]) {
            return;
        }
        throw new Error(
            `Invalid flow "${input.flow}". Allowed flows: ${Object.keys(this.factories).join(
                ", "
            )}.`
        );
    }
}
