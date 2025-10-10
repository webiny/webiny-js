import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { ContextPlugin } from "@webiny/api";
import {
    createStorageOperations,
    createCmsEntryElasticsearchBodyModifierPlugin
} from "../../dist/index";
import { configurations } from "../../dist/configurations";
import { base as baseIndexConfigurationPlugin } from "../../dist/elasticsearch/indices/base";
import { setStorageOps } from "@webiny/project-utils/testing/environment";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch";
import { getElasticsearchOperators } from "@webiny/api-elasticsearch/operators";

if (typeof createStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const { getElasticsearchIndexPrefix } = require("@webiny/api-elasticsearch");

const prefix = getElasticsearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-env-`;
}

setStorageOps("cms", () => {
    const documentClient = getDocumentClient();
    const { elasticsearchClient, plugins } = getElasticsearchClient({
        name: "api-headless-cms-ddb-es",
        prefix: "api-headless-cms-env-"
    });

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
        context.waitFor(["cms"], async () => {
            context.cms.onEntryBeforeCreate.subscribe(async ({ model }) => {
                const index = createIndexName(model);
                try {
                    const response = await elasticsearchClient.indices.exists({
                        index
                    });
                    if (response.body) {
                        return;
                    }
                    await elasticsearchClient.indices.create({
                        index,
                        body: {
                            ...baseIndexConfigurationPlugin.body
                        }
                    });
                } catch {}
            });
        });
    });

    const initializedDbPlugins = dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient
        })
    });

    createOrRefreshIndexSubscription.name =
        "headlessCmsDdbEs.context.createOrRefreshIndexSubscription";

    return {
        storageOperations: createStorageOperations({
            documentClient,
            elasticsearch: elasticsearchClient,
            plugins: [
                ...initializedDbPlugins,
                getElasticsearchOperators(),
                createCmsEntryElasticsearchBodyModifierPlugin({
                    modifyBody: ({ body }) => {
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
                    },
                    model: "fruit"
                })
            ]
        }),
        plugins: [...plugins, ...initializedDbPlugins, createOrRefreshIndexSubscription]
    };
});
