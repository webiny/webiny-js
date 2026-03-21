import { expect } from "vitest";
import path from "path";
import { ContextPlugin } from "@webiny/api";
import elasticsearchClientContextPlugin, {
    getOpenSearchOperators as getElasticsearchOperators
} from "@webiny/api-opensearch";
import { logger } from "../logger";
import { createHandler } from "@webiny/handler-aws";
import { createEventHandler as createDynamoDBToElasticsearchEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import { elasticIndexManager } from "../helpers/elasticIndexManager";
import type { ElasticsearchClient } from "./createClient";
import { createElasticsearchClient } from "./createClient";
import { getDocumentClient, simulateStream } from "../dynamodb";
import type { PluginCollection } from "../environment";
import type { OpenSearchContext } from "../../../api-opensearch/src/types";
import { getOpenSearchIndexPrefix as getOpenSearchIndexPrefix } from "../../../api-opensearch/src/indexPrefix";
import { createMockApiLogContextPlugin } from "../mockApiLog";

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
    public readonly elasticsearchClient: ElasticsearchClient;
    public readonly plugins: PluginCollection;
    private onBeforeEach: { name: string; cb: OnBeforeEach }[] = [];

    public constructor(prefix: string) {
        if (prefix !== "") {
            // Prefix will only be handled once, for the first processed storage operations.
            const indexPrefix = getOpenSearchIndexPrefix();
            if (!indexPrefix.includes("api-")) {
                process.env.OPENSEARCH_INDEX_PREFIX = `${indexPrefix}${prefix}`;
            }
        }

        logger.debug(`ES index prefix = "%s"`, getOpenSearchIndexPrefix());

        const documentClient = getDocumentClient();
        this.elasticsearchClient = createElasticsearchClient();
        const elasticsearchClientContext = elasticsearchClientContextPlugin(
            this.elasticsearchClient
        );

        /**
         * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
         */
        const simulationContext = new ContextPlugin<OpenSearchContext>(async context => {
            await elasticsearchClientContext.apply(context);
        });

        const dynamoDbHandler = createHandler({
            plugins: [
                simulationContext,
                createMockApiLogContextPlugin(),
                createDynamoDBToElasticsearchEventHandler()
            ]
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

        this.plugins = [elasticsearchClientContext, ...getElasticsearchOperators()];
    }

    setOnBeforeEach(name: string, cb: OnBeforeEach) {
        if (!this.onBeforeEach.find(item => item.name === name)) {
            this.onBeforeEach.push({ name, cb });
        }
    }
}
