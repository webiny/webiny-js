import { EntryBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver, registerDynamoDBCore } from "@webiny/db-dynamodb";
import { getDocumentClient, simulateStream } from "@webiny/project-utils/testing/dynamodb/index.js";
import { ContextPlugin } from "@webiny/api";
import { registerCmsOpenSearchStorageOperations } from "../../src/index";
import { CmsEntryOpenSearchBodyModifier } from "../../src/features/CmsEntryOpenSearchBodyModifier/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { configurations } from "../../src/configurations";
import { setStorageOps } from "@webiny/project-utils/testing/environment";
import {
    getTestOpenSearchClient,
    registerOpenSearchCoreForTests
} from "@webiny/api-opensearch/testing/index.js";
import { registerOpenSearchCore, getBaseConfiguration } from "@webiny/api-opensearch";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import { createHandler } from "@webiny/handler-aws";
import { createEventHandler as createDynamoDBToElasticsearchEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import { createMockApiLogContextPlugin } from "@webiny/project-utils/testing/mockApiLog";

if (typeof registerCmsOpenSearchStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const prefix = getOpenSearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-env-`;
}

const documentClient = getDocumentClient();
const opensearchClient = getTestOpenSearchClient();

const dynamoDbToEsHandler = createHandler({
    plugins: [
        registerOpenSearchCore(opensearchClient),
        createMockApiLogContextPlugin(),
        createDynamoDBToElasticsearchEventHandler()
    ]
});
simulateStream(documentClient, dynamoDbToEsHandler);

setStorageOps("cms", () => {
    const createIndexName = model => {
        const { index } = configurations.es({
            model
        });
        return index;
    };

    /**
     * We need to create model index before entry create because of the direct storage operations tests.
     * When running direct storage ops tests, index is created on the fly otherwise and then it is not cleaned up afterwards.
     *
     * When creating, updating, creating from, publishing, unpublishing and deleting we need to refresh index.
     */
    const createOrRefreshIndexSubscription = new ContextPlugin(async context => {
        context.container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle(event) {
                const client = context.container.resolve(OpenSearchClient);
                const { model } = event.payload;
                const index = createIndexName(model);
                try {
                    const response = await client.indices.exists({
                        index
                    });
                    if (response.body) {
                        return;
                    }
                    await client.indices.create({
                        index,
                        body: {
                            ...getBaseConfiguration().body
                        }
                    });
                } catch {}
            }
        }));
    });
    createOrRefreshIndexSubscription.name =
        "headlessCmsDdbEs.context.createOrRefreshIndexSubscription";

    const initializedDbPlugins = dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient
        })
    });

    createOrRefreshIndexSubscription.name =
        "headlessCmsDdbEs.context.createOrRefreshIndexSubscription";

    const fruitModifierPlugin = createRegisterExtensionPlugin(({ container }) => {
        const FruitBodyModifier = CmsEntryOpenSearchBodyModifier.createImplementation({
            implementation: class {
                modelId = "fruit";
                modifyBody({ body }) {
                    if (!body.sort.customSorter) {
                        return;
                    }
                    const order = body.sort.customSorter.order;
                    delete body.sort.customSorter;
                    body.sort = {
                        createdOn: {
                            order,
                            unmapped_type: "date"
                        }
                    };
                }
            },
            dependencies: []
        });
        container.register(FruitBodyModifier);
    });

    fruitModifierPlugin.name = "headlessCmsDdbEs.plugins.fruitModifierPlugin";

    return {
        storageOperations: {},
        plugins: [
            registerDynamoDBCore({
                documentClient
            }),
            registerOpenSearchCoreForTests(),
            registerCmsOpenSearchStorageOperations(),
            ...initializedDbPlugins,
            createOrRefreshIndexSubscription,
            fruitModifierPlugin
        ]
    };
});
