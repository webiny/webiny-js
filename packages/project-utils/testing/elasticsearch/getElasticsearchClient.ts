import { expect } from "vitest";
import path from "path";
import { registerOpensearchCore } from "@webiny/api-opensearch";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { logger } from "../logger";
import { createHandler } from "@webiny/handler-aws";
import { createEventHandler as createDynamoDBToElasticsearchEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import { elasticIndexManager } from "../helpers/elasticIndexManager";
import { getDocumentClient, simulateStream } from "../dynamodb";
import { getOpenSearchIndexPrefix } from "../../../api-opensearch/src/indexPrefix";
import { createMockApiLogContextPlugin } from "../mockApiLog";
import type { TestOpenSearchClient } from "@webiny/api-opensearch/testing";

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
    public readonly elasticsearchClient: TestOpenSearchClient;
    private onBeforeEach: { name: string; cb: OnBeforeEach }[] = [];

    public constructor(prefix: string) {
        if (prefix !== "") {
            const indexPrefix = getOpenSearchIndexPrefix();
            if (!indexPrefix.includes("api-")) {
                process.env.OPENSEARCH_INDEX_PREFIX = `${indexPrefix}${prefix}`;
            }
        }

        logger.debug(`ES index prefix = "%s"`, getOpenSearchIndexPrefix());

        const documentClient = getDocumentClient();
        this.elasticsearchClient = createTestOpenSearchClient();

        const dynamoDbHandler = createHandler({
            plugins: [
                registerOpensearchCore(this.elasticsearchClient),
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
    }

    setOnBeforeEach(name: string, cb: OnBeforeEach) {
        if (!this.onBeforeEach.find(item => item.name === name)) {
            this.onBeforeEach.push({ name, cb });
        }
    }
}
