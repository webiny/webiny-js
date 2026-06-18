import type {
    IDataSynchronizationInput,
    IDataSynchronizationManager,
    IFactories
} from "./types.js";
import type { IIndexManager } from "~/settings/types.js";
import { ElasticsearchFetcher } from "./elasticsearch/ElasticsearchFetcher.js";
import { ElasticsearchSynchronize } from "./elasticsearch/abstractions/ElasticsearchSynchronize.js";

export interface IDataSynchronizationTaskRunnerParams {
    manager: IDataSynchronizationManager;
    indexManager: IIndexManager;
    factories: IFactories;
    elasticsearchSynchronize: ElasticsearchSynchronize.Interface;
}

export class DataSynchronizationTaskRunner {
    private readonly manager;
    private readonly indexManager;
    private readonly factories;
    private readonly elasticsearchSynchronize;

    public constructor(params: IDataSynchronizationTaskRunnerParams) {
        this.manager = params.manager;
        this.indexManager = params.indexManager;
        this.factories = params.factories;
        this.elasticsearchSynchronize = params.elasticsearchSynchronize;
    }

    public async run(input: IDataSynchronizationInput) {
        this.validateFlow(input);
        /**
         * Go through the Elasticsearch and delete records which do not exist in the Elasticsearch table.
         */
        //
        if (input.flow === "elasticsearchToDynamoDb" && !input.elasticsearchToDynamoDb?.finished) {
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
