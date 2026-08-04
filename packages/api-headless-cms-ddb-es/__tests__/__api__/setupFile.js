import { EntryBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { dbPlugins } from "@webiny/db-dynamodb/testing.js";
import { registerDynamoDBCore } from "@webiny/db-dynamodb";
import { getDocumentClient, simulateStream } from "@webiny/project-utils/testing/dynamodb/index.js";
import { HeadlessCmsDdbEsFeature } from "../../src/index";
import { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { setStorageOps } from "@webiny/project-utils/testing/environment";
import {
    getTestOpenSearchClient,
    registerOpenSearchCoreForTests
} from "@webiny/api-opensearch/testing/index.js";
import { getBaseConfiguration, isSharedOpenSearchIndex } from "@webiny/api-opensearch";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import { createDdbToOpenSearchStreamHandler } from "@webiny/api-sync-ddb-to-opensearch";

const prefix = getOpenSearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-env-`;
}

const documentClient = getDocumentClient();
const opensearchClient = getTestOpenSearchClient();

simulateStream(documentClient, createDdbToOpenSearchStreamHandler(opensearchClient));

setStorageOps("cms", () => {
    const createIndexName = model => {
        const shared = isSharedOpenSearchIndex();
        const idx = [shared ? "root" : model.tenant, "headless-cms", model.modelId]
            .join("-")
            .toLowerCase();
        const pfx = getOpenSearchIndexPrefix();
        return pfx ? pfx + idx : idx;
    };

    /**
     * We need to create model index before entry create because of the direct storage operations tests.
     * When running direct storage ops tests, index is created on the fly otherwise and then it is not cleaned up afterwards.
     *
     * When creating, updating, creating from, publishing, unpublishing and deleting we need to refresh index.
     */
    const createOrRefreshIndexSubscription = createRegisterExtensionPlugin(({ container }) => {
        container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle(event) {
                const client = container.resolve(OpenSearchClient);
                const { model } = event.payload;
                const index = createIndexName(model);
                try {
                    const response = await client.use().indices.exists({
                        index
                    });
                    if (response.body) {
                        return;
                    }
                    await client.use().indices.create({
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

    const initializedDbPlugins = dbPlugins();

    createOrRefreshIndexSubscription.name =
        "headlessCmsDdbEs.context.createOrRefreshIndexSubscription";

    const fruitModifierPlugin = createRegisterExtensionPlugin(({ container }) => {
        // eslint-disable-next-line webiny/require-implements-on-create-implementation -- plain JS file: TypeScript `implements` is invalid syntax here.
        class FruitBodyModifierImplementation {
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
        }
        const FruitBodyModifier = CmsEntryOpenSearchBodyModifier.createImplementation({
            implementation: FruitBodyModifierImplementation,
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
            createRegisterExtensionPlugin(context =>
                HeadlessCmsDdbEsFeature.register(context.container)
            ),
            ...initializedDbPlugins,
            createOrRefreshIndexSubscription,
            fruitModifierPlugin
        ]
    };
});
