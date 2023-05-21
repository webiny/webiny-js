import { ContextPlugin } from "@webiny/api";
import elasticsearchClientContextPlugin, {
    createGzipCompression,
    getElasticsearchOperators
} from "@webiny/api-elasticsearch";
import { createHandler as createDynamoDBHandler } from "@webiny/handler-aws/dynamodb";
import { createEventHandler as createDynamoDBToElasticsearchEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import { elasticIndexManager } from "../helpers/elasticIndexManager";
import { createElasticsearchClient } from "./createClient";
import { simulateStream, getDocumentClient } from "../dynamodb";
import { ElasticsearchClient } from "./client";
import { PluginCollection } from "../environment";

interface GetElasticsearchClientParams {
    prefix?: string;
    onBeforeEach?: OnBeforeEach;
}

const cache: Record<string, ElasticsearchClientConfig> = {};

export const getElasticsearchClient = (
    params: GetElasticsearchClientParams = {}
): ElasticsearchClientConfig => {
    const testId = expect.getState().currentTestName;

    const config = cache[testId] || new ElasticsearchClientConfig(params.prefix || "");
    if (params.onBeforeEach) {
        config.setOnBeforeEach(params.onBeforeEach);
    }
    cache[testId] = config;

    return config;
};

interface OnBeforeEach {
    (): Promise<void> | void;
}

export class ElasticsearchClientConfig {
    public elasticsearchClient: ElasticsearchClient;
    public plugins: PluginCollection;
    private onBeforeEach: OnBeforeEach[] = [];

    constructor(prefix: string) {
        if (prefix !== "") {
            // Prefix will only be handled once, for the first processed storage operations.
            const indexPrefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
            if (!indexPrefix.includes(prefix)) {
                process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${indexPrefix}${prefix}`;
            }
        }

        const documentClient = getDocumentClient();
        this.elasticsearchClient = createElasticsearchClient() as ElasticsearchClient;
        const elasticsearchClientContext = elasticsearchClientContextPlugin(
            this.elasticsearchClient
        );

        /**
         * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
         */
        const gzipCompression = createGzipCompression();
        const simulationContext = new ContextPlugin(async context => {
            context.plugins.register(gzipCompression);
            await elasticsearchClientContext.apply(context as any);
        });

        simulateStream(
            documentClient,
            createDynamoDBHandler({
                plugins: [simulationContext, createDynamoDBToElasticsearchEventHandler()]
            })
        );

        elasticIndexManager({
            global: global,
            client: this.elasticsearchClient,
            onBeforeEach: async () => {
                for (const cb of this.onBeforeEach) {
                    await cb();
                }
            }
        });

        this.plugins = [
            elasticsearchClientContext,
            gzipCompression,
            ...getElasticsearchOperators()
        ];
    }

    setOnBeforeEach(cb: OnBeforeEach) {
        this.onBeforeEach.push(cb);
    }
}
