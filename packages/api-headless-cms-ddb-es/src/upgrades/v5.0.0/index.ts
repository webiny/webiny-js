/**
 * File not used anymore.
 */
// @ts-nocheck
import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import {
    entryValueFixer,
    cleanDatabaseRecord,
    createFieldFinder,
    createOldVersionIndiceName
} from "./helpers";

import { paginateBatch } from "../utils";
import { CmsIndexEntry } from "../../types";
import { CmsModel, CmsContext } from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";
import { Client } from "@elastic/elasticsearch";

interface Hit {
    _id: string;
    _index: string;
    _source: CmsIndexEntry;
}

const plugin = (): UpgradePlugin<CmsContext> => ({
    name: "api-upgrade-cms-5.0.0",
    type: "api-upgrade",
    app: "headless-cms",
    version: "5.0.0",
    async apply(context) {
        const { db, fileManager } = context;
        const elasticsearch: Client = (context as any).elasticsearch;
        if (!elasticsearch) {
            throw new WebinyError("Missing Elasticsearch client on the context.");
        }

        // Check if we still have the old elasticsearch index
        const esIndex = createOldVersionIndiceName(context);
        const { body: exists } = await elasticsearch.indices.exists({
            index: esIndex
        });

        if (!exists) {
            return;
        }

        try {
            await elasticsearch.indices.putIndexTemplate({
                name: "headless-cms-entries-index",
                body: {
                    index_patterns: ["*headless-cms*"],
                    settings: {
                        analysis: {
                            analyzer: {
                                lowercase_analyzer: {
                                    type: "custom",
                                    filter: ["lowercase", "trim"],
                                    tokenizer: "keyword"
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            property: {
                                type: "text",
                                fields: {
                                    keyword: {
                                        type: "keyword",
                                        ignore_above: 256
                                    }
                                },
                                analyzer: "lowercase_analyzer"
                            },
                            rawValues: {
                                type: "object",
                                enabled: false
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.log(err);
            throw new WebinyError("Put index template failed!");
        }

        // Load existing ES items
        let hasMoreItems = true;
        let after: string | undefined = undefined;
        const limit = 1000;
        let esItems = [];

        // go through old index and load data in bulks of 1000
        while (hasMoreItems) {
            const response = await elasticsearch.search({
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
            name: "upgrade-headless-cms-es-5.0.0.json",
            type: "application/json",
            size: esJSON.length,
            buffer: Buffer.from(esJSON)
        });

        console.log(`Stored backup of Elasticsearch items to ${file.key}`);

        // Load models for each locale and distribute ES items to new per-model indexes
        const locales = context.i18n.getLocales();

        const esOperations = [];

        for (const locale of locales) {
            const [models] = await db.read<CmsModel>({
                // @ts-ignore
                ...configurations.db(),
                query: { PK: `T#root#L#${locale.code}#CMS#CM`, SK: { $gt: " " } }
            });

            // Sleep for 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));

            const modelsById: Record<string, CmsModel> = models.reduce((acc, model) => {
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

                    const indexName =
                        `root-headless-cms-${locale.code}-${model.modelId}`.toLowerCase();
                    const PK = `T#root#L#${locale.code}#CMS#CME#${entry.id.split("#")[0]}`;
                    const SK = entry.__type === "cms.entry.l" ? "L" : "P";
                    const esData = {
                        ...entryValueFixer(model, modelFieldFinder, cleanDatabaseRecord(entry)),
                        webinyVersion: "5.0.0"
                    };

                    esOperations.push({ index: { _index: indexName, _id: `${PK}:${SK}` } }, esData);

                    return {
                        PK,
                        SK,
                        index: indexName,
                        data: esData,
                        savedOn: new Date().toISOString(),
                        version: "5.0.0",
                        ignore: true
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
                                // @ts-ignore
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
                                // @ts-ignore
                                ...configurations.db(),
                                data: {
                                    ...model,
                                    locale: locale.code,
                                    webinyVersion: "5.0.0"
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

        // ES BULK INSERT
        const bulkInsert = await elasticsearch.bulk({
            body: esOperations
        });

        console.log("ES bulk index", bulkInsert);
    }
});

export default plugin;
