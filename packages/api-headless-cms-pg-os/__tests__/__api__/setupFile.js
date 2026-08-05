import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { HeadlessCmsPgOsFeature } from "../../src/index.js";
import { createCmsEntryFieldSortingPlugin } from "@webiny/api-headless-cms-storage/plugins/CmsEntryFieldSortingPlugin.js";
import { registerSQLCore } from "@webiny/api-core-sql";
import { createApiCoreSql } from "@webiny/api-core-sql/createApiCoreSql.js";
import { getSqlTablePrefix } from "@webiny/api-core-sql/getSqlTablePrefix.js";
import { EntryBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import {
    getTestOpenSearchClient,
    registerOpenSearchCoreForTests
} from "@webiny/api-opensearch/testing/index.js";
import { getBaseConfiguration } from "@webiny/api-opensearch";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import { createPgToOpenSearchHandler } from "@webiny/api-sync-pg-to-opensearch";
import { createSyncBridge } from "./syncBridge.js";
import { createTestModelIndexName } from "@webiny/api-headless-cms-utils-os/testing/index.js";

const prefix = getOpenSearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-pg-os-env-`;
}

const client = await import("./createPgliteClient.js");
const knex = global.__testKnex || (await client.createKnex());
global.__testKnex = knex;
global.__testClient = client;

const opensearchClient = getTestOpenSearchClient();
const syncHandler = createPgToOpenSearchHandler(opensearchClient);

const syncTableName = "cms_os_sync";
const syncBridge = createSyncBridge(knex, syncTableName, syncHandler);

global.__testSyncBridge = syncBridge;

const tableNamePrefix = process.env.SQL_TABLE_PREFIX || process.env.WEBINY_SQL_TABLE_PREFIX || "";

setStorageOps("apiCore", () => {
    return {
        storageOperations: createApiCoreSql({ knex, tableNamePrefix: getSqlTablePrefix() }),
        plugins: []
    };
});

setStorageOps("cms", () => {
    const createOrRefreshIndexSubscription = createRegisterExtensionPlugin(({ container }) => {
        container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle(event) {
                const client = container.resolve(OpenSearchClient);
                const { model } = event.payload;
                const index = await createTestModelIndexName(container, { model });
                try {
                    const response = await client.use().indices.exists({ index });
                    if (response.body) {
                        return;
                    }
                    await client.use().indices.create({
                        index,
                        body: { ...getBaseConfiguration().body }
                    });
                } catch {}
            }
        }));
    });
    createOrRefreshIndexSubscription.name =
        "headlessCmsPgOs.context.createOrRefreshIndexSubscription";

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
                    createdOn: { order, unmapped_type: "date" }
                };
            }
        }
        const FruitBodyModifier = CmsEntryOpenSearchBodyModifier.createImplementation({
            implementation: FruitBodyModifierImplementation,
            dependencies: []
        });
        container.register(FruitBodyModifier);
    });
    fruitModifierPlugin.name = "headlessCmsPgOs.plugins.fruitModifierPlugin";

    return {
        storageOperations: {},
        plugins: [
            registerSQLCore({ knex }),
            registerOpenSearchCoreForTests(),
            createRegisterExtensionPlugin(context =>
                HeadlessCmsPgOsFeature.register(context.container, { knex, tableNamePrefix })
            ),
            createOrRefreshIndexSubscription,
            fruitModifierPlugin,
            createCmsEntryFieldSortingPlugin({
                canUse: params => params.fieldId === "customSorter",
                createSort: params => {
                    const { order, fields } = params;
                    const field = Object.values(fields).find(f => f.fieldId === "createdBy");
                    if (!field) {
                        throw new Error("Impossible, but it seems there is no field createdBy.");
                    }
                    return {
                        reverse: order === "DESC",
                        valuePath: "createdBy.id",
                        field,
                        fieldId: field.fieldId
                    };
                }
            })
        ]
    };
});
