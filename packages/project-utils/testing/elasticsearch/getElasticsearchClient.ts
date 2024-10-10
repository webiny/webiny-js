import path from "path";
import { ContextPlugin } from "@webiny/api";
import elasticsearchClientContextPlugin, {
    createGzipCompression,
    getElasticsearchOperators
} from "@webiny/api-elasticsearch";
import { logger } from "../logger";
import { createHandler } from "@webiny/handler-aws";
import { createEventHandler as createDynamoDBToElasticsearchEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import { elasticIndexManager } from "../helpers/elasticIndexManager";
import { createElasticsearchClient, ElasticsearchClient } from "./createClient";
import { getDocumentClient, simulateStream } from "../dynamodb";
import { PluginCollection } from "../environment";
import { ElasticsearchContext } from "../../../api-elasticsearch/src/types";
import { getElasticsearchIndexPrefix } from "../../../api-elasticsearch/src/indexPrefix";

interface GetElasticsearchClientParams {
    name: string;
    prefix?: string;
    onBeforeEach?: OnBeforeEach;
}

const cache: Record<string, ElasticsearchClientConfig> = {};

export const getElasticsearchClient = (params: GetElasticsearchClientParams) => {
    logger.debug(`getElasticsearchClient() called by "%s"`, params.name);
    const state = expect.getState();
    const testId = path.basename(state.testPath || "");

    let config = cache[testId];
    if (!config) {
        logger.debug(`Creating a new ES client; cache key = "%s"`, testId);
        config = new ElasticsearchClientConfig(params.prefix || "");
    } else {
        logger.debug(`Using cached ES client; cache key = "%s"`, testId);
    }

    if (params.onBeforeEach) {
        config.setOnBeforeEach(params.name, params.onBeforeEach);
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
    private onBeforeEach: { name: string; cb: OnBeforeEach }[] = [];

    constructor(prefix: string) {
        if (prefix !== "") {
            // Prefix will only be handled once, for the first processed storage operations.
            const indexPrefix = getElasticsearchIndexPrefix();
            if (!indexPrefix.includes("api-")) {
                process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${indexPrefix}${prefix}`;
            }
        }

        logger.debug(`ES index prefix = "%s"`, getElasticsearchIndexPrefix());

        const documentClient = getDocumentClient();
        this.elasticsearchClient = createElasticsearchClient() as ElasticsearchClient;
        const elasticsearchClientContext = elasticsearchClientContextPlugin(
            this.elasticsearchClient
        );

        /**
         * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
         */
        const gzipCompression = createGzipCompression();
        const simulationContext = new ContextPlugin<ElasticsearchContext>(async context => {
            context.plugins.register(gzipCompression);
            await elasticsearchClientContext.apply(context);
        });

        const dynamoDbHandler = createHandler({
            plugins: [simulationContext, createDynamoDBToElasticsearchEventHandler()]
        });
        simulateStream(documentClient, dynamoDbHandler);

        elasticIndexManager({
            global: global,
            client: this.elasticsearchClient,
            onBeforeEach: async () => {
                for (const onBeforeEach of this.onBeforeEach) {
                    await onBeforeEach.cb();
                }
            }
        });

        this.plugins = [
            elasticsearchClientContext,
            gzipCompression,
            ...getElasticsearchOperators()
        ];
    }

    setOnBeforeEach(name: string, cb: OnBeforeEach) {
        if (!this.onBeforeEach.find(item => item.name === name)) {
            this.onBeforeEach.push({ name, cb });
        }
    }
}
