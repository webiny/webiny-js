import { SystemUpgrade } from "@webiny/system-upgrade/types";
import { CmsContentIndexEntry, CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import { compare as semverCompare } from "semver";
import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import WebinyError from "@webiny/error";
import { defaults as configurations, ElasticsearchConfig } from "../utils";

interface Hit {
    _id: string;
    _index: string;
    _source: CmsContentIndexEntry;
}

const createElasticsearchIndex = (es: ElasticsearchClient, esIndex: ElasticsearchConfig) => {
    return new Promise(async (resolve: (value?: unknown) => void, reject: (ex: Error) => void) => {
        try {
            await es.indices.create({
                ...esIndex,
                body: {
                    // we are disabling indexing of rawValues property in object that is inserted into ES
                    mappings: {
                        properties: {
                            rawValues: { type: "object", enabled: false }
                        }
                    }
                }
            });
            resolve();
        } catch (ex) {
            const er = new WebinyError(
                "Could not create Elasticsearch index.",
                "ELASTICSEARCH_INDEX",
                ex
            );
            reject(er);
        }
    });
};

const createOldIndexName = (context: CmsContext): string => {
    return `${context.security.getTenant().id}-headless-cms`;
};

const deleteCreatedElasticsearchIndexes = async (
    context: CmsContext,
    indexes: ElasticsearchConfig[]
): Promise<void> => {
    await Promise.all(
        indexes.map(index => {
            return context.elasticSearch.indices.delete(index);
        })
    );
};

const moveReferenceValues = (
    model: CmsContentModel,
    entry: CmsContentIndexEntry
): CmsContentIndexEntry => {
    return {
        ...entry
    };
};

const pluginVersion = "5.0.0-beta.5";

export default (): SystemUpgrade<CmsContext> => ({
    type: "system-upgrade",
    version: pluginVersion,
    isApplicable: async context => {
        const { elasticSearch } = context;
        // if we still old elasticsearch index
        const esIndex = createOldIndexName(context);
        const { body: exists } = await elasticSearch.indices.exists({
            index: esIndex
        });
        return exists;
    },
    apply: async (context, codeVersion) => {
        const { elasticSearch } = context;
        const models = (await context.cms.models.noAuth().list())
            // make sure to filter out models that were created with current version
            .filter(model => {
                if (!model.webinyVersion) {
                    return true;
                }
                return semverCompare(codeVersion, model.webinyVersion) === 1;
            });

        const indexes: ElasticsearchConfig[] = models.map(model => {
            return configurations.es(context, model);
        });
        // create new indexes in a single promise
        try {
            await Promise.all(
                indexes.map(index => {
                    return createElasticsearchIndex(elasticSearch, index);
                })
            );
        } catch (ex) {
            await deleteCreatedElasticsearchIndexes(context, indexes);
            throw new WebinyError(ex.message, ex.code, ex.data);
        }
        const modelsById: Record<string, CmsContentModel> = models.reduce((acc, model) => {
            acc[model.modelId] = model;
            return acc;
        }, {});
        const oldIndexName = createOldIndexName(context);

        let hasMoreResults = true;
        let after: string | undefined = undefined;
        const limit = 1001;
        // go through old index and search the data in a loop to minimize es hammering
        while (hasMoreResults) {
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
                    limit,
                    after
                }
            });
            const { hits } = response.body.hits;
            /**
             *  build a items list to be inserted by bulk
             *
             *  https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
             */
            const esOperations = hits.map((hit: Hit) => {
                const entry = hit._source;
                const model = modelsById[entry.modelId];
                if (!model) {
                    throw new WebinyError(
                        "Could not find model for given entry.",
                        "MODEL_NOT_FOUND_ERROR",
                        {
                            entry: {
                                id: entry.id,
                                modelId: entry.modelId
                            }
                        }
                    );
                }
                return [
                    // first part of the array is the es operation
                    {
                        index: {
                            _id: hit._id,
                            _index: configurations.es(context, model)
                        }
                    },
                    // second is the data to be inserted
                    {
                        ...moveReferenceValues(model, entry),
                        webinyVersion: pluginVersion
                    } as CmsContentIndexEntry
                ];
            });
            hasMoreResults = esOperations.length > limit;
            if (hasMoreResults) {
                esOperations.pop();
            }
            after = esOperations.length > 0 ? hits[esOperations.length - 1].sort : undefined;

            await elasticSearch.bulk({ body: esOperations });
        }

        await elasticSearch.indices.delete({
            index: oldIndexName
        });
    }
});
