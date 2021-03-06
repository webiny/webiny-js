import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsContentIndexEntry, CmsContentModel, CmsContext } from "../../../types";
import { defaults as configurations, ElasticsearchConfig } from "../../../utils";
import {
    entryValueFixer,
    cleanDatabaseRecord,
    createFieldFinder,
    createOldVersionIndiceName,
    createElasticsearchIndice,
    deleteCreatedElasticsearchIndices
} from "./helpers";

import { paginateBatch } from "../utils";

interface Hit {
    _id: string;
    _index: string;
    _source: CmsContentIndexEntry;
}

const plugin: UpgradePlugin<CmsContext> = {
    type: "api-upgrade",
    app: "headless-cms",
    version: "5.0.0-beta.5",
    async apply(context) {
        const { elasticSearch, db, fileManager } = context;

        // Check if we still have the old elasticsearch index
        const esIndex = createOldVersionIndiceName(context);
        const { body: exists } = await elasticSearch.indices.exists({
            index: esIndex
        });

        if (!exists) {
            return;
        }

        const models = await context.cms.models.noAuth().list();

        const indexes: ElasticsearchConfig[] = models.map(model => {
            return configurations.es(context, model);
        });

        // create new indexes in a single promise
        try {
            await Promise.all(
                indexes.map(index => {
                    return createElasticsearchIndice(elasticSearch, index);
                })
            );
        } catch (ex) {
            await deleteCreatedElasticsearchIndices(context, indexes);
            throw new WebinyError(ex.message, ex.code, ex.data);
        }

        const modelsById: Record<string, CmsContentModel> = models.reduce((acc, model) => {
            acc[model.modelId] = model;
            return acc;
        }, {});

        const oldIndexName = createOldVersionIndiceName(context);

        let hasMoreItems = true;
        let after: string | undefined = undefined;
        const limit = 1000;
        let esItems = [];

        const modelFieldFinder = createFieldFinder(models);

        // go through old index and load data in bulks of 1000
        while (hasMoreItems) {
            const response = await elasticSearch.search({
                index: oldIndexName,
                body: {
                    sort: {
                        createdOn: {
                            order: "asc",
                            // eslint-disable-next-line
                            unmapped_type: "date"
                        }
                    },
                    size: limit + 1,
                    after
                }
            });

            const { hits } = response.body.hits;

            hasMoreItems = hits.length > limit;
            after = hasMoreItems ? hits[limit - 1].sort : undefined;
            esItems = [...esItems, ...hits.filter(item => !item._id.includes("T#root#"))];
        }

        console.log(`Fetched ${esItems.length} items from Elasticsearch`);
        if (esItems.length === 0) {
            return;
        }

        // Store a backup of old items
        const esJSON = JSON.stringify(esItems);

        const { file } = await fileManager.storage.storagePlugin.upload({
            name: "upgrade-headless-cms-es-5.0.0-beta.5.json",
            type: "application/json",
            size: esJSON.length,
            buffer: Buffer.from(esJSON),
            settings: {}
        });

        console.log(`Stored backup of Elasticsearch items to ${file.key}`);

        /**
         *  Build a list of items for ES DDB table
         */
        const ddbItems = esItems
            .map((hit: Hit) => {
                const entry = hit._source;
                const model = modelsById[entry.modelId];
                if (!model) {
                    return null;
                }

                return {
                    PK: entry.PK,
                    SK: entry.__type === "cms.entry.l" ? "L" : "P",
                    index: configurations.es(context, model).index,
                    data: {
                        ...entryValueFixer(model, modelFieldFinder, cleanDatabaseRecord(entry)),
                        webinyVersion: "5.0.0-beta.5"
                    },
                    savedOn: new Date().toISOString()
                };
            })
            .filter(Boolean);

        console.log(`Prepared ${ddbItems.length} ES DDB items.`);

        // Insert items into ES DDB table
        await paginateBatch(ddbItems, 25, async items => {
            const batch = db.batch();
            await batch
                .create(
                    ...items.map(item => {
                        return {
                            ...configurations.esDb(),
                            data: item
                        };
                    })
                )
                .execute();
        });

        console.log("Inserted ES DDB items.");

        // update all models to latest version
        await paginateBatch(models, 25, async items => {
            await db
                .batch()
                .create(
                    ...items.map(model => {
                        return {
                            ...configurations.db(),
                            data: {
                                ...model,
                                webinyVersion: "5.0.0-beta.5"
                            }
                        };
                    })
                )
                .execute();
        });

        console.log("Updated DDB model records with version number.");

        // delete the old index
        await elasticSearch.indices.delete({
            index: oldIndexName
        });

        console.log(`Deleted ${oldIndexName} index.`);
    }
};

export default plugin;
