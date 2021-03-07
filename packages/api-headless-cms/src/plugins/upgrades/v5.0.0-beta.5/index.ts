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
import * as utils from "../../../utils";

interface Hit {
    _id: string;
    _index: string;
    _source: CmsContentIndexEntry;
}

const plugin: UpgradePlugin<CmsContext> = {
    name: "api-upgrade-cms",
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

        // Load existing ES items
        let hasMoreItems = true;
        let after: string | undefined = undefined;
        const limit = 1000;
        let esItems = [];

        // go through old index and load data in bulks of 1000
        while (hasMoreItems) {
            const response = await elasticSearch.search({
                index: esIndex,
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

        // Load models for each locale and distribute ES items to new per-model indexes
        const locales = context.i18n.getLocales();

        for (const locale of locales) {
            const [models] = await db.read<CmsContentModel>({
                ...utils.defaults.db(),
                query: { PK: `T#root#L#${locale.code}#CMS#CM`, SK: { $gt: " " } }
            });

            const indexes: ElasticsearchConfig[] = models.map(model => ({
                index: `root-headless-cms-${locale.code}-${model.modelId}`.toLowerCase()
            }));

            // create new indexes in a single promise
            try {
                await Promise.all(
                    indexes.map(index => createElasticsearchIndice(elasticSearch, index))
                );
            } catch (ex) {
                await deleteCreatedElasticsearchIndices(context, indexes);
                throw new WebinyError(ex.message, ex.code, ex.data);
            }

            const modelsById: Record<string, CmsContentModel> = models.reduce((acc, model) => {
                acc[model.modelId] = model;
                return acc;
            }, {});

            /**
             *  Build a list of items for ES DDB table
             */
            const ddbItems = esItems
                .filter((hit: Hit) => {
                    return hit._source.locale === locale.code;
                })
                .map((hit: Hit) => {
                    const entry = hit._source;
                    const model = modelsById[entry.modelId];
                    if (!model) {
                        return null;
                    }

                    const modelFieldFinder = createFieldFinder(models);

                    return {
                        PK: `T#root#L#${locale.code}#CMS#CME#${entry.id.split("#")[0]}`,
                        SK: entry.__type === "cms.entry.l" ? "L" : "P",
                        index: configurations.es(context, model).index,
                        data: {
                            ...entryValueFixer(model, modelFieldFinder, cleanDatabaseRecord(entry)),
                            webinyVersion: "5.0.0-beta.5"
                        },
                        savedOn: new Date().toISOString(),
                        version: "5.0.0-beta.5"
                    };
                })
                .filter(Boolean);

            console.log(`[${locale.code}] Prepared ${ddbItems.length} ES DDB items.`);

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

            console.log(`[${locale.code}] Inserted ES DDB items.`);

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
                                    locale: locale.code,
                                    webinyVersion: "5.0.0-beta.5"
                                }
                            };
                        })
                    )
                    .execute();
            });

            console.log(
                `[${locale.code}] Updated DDB model records with version number and locale code.`
            );
        }
    }
};

export default plugin;
