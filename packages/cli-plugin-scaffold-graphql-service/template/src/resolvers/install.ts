import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { utils } from "../utils";
import { ApplicationContext } from "../types";

/**
 * Install mutation is Elasticsearch index creation.
 * Can be removed if Elasticsearch is not used.
 */
const install = async (_, __, context: ApplicationContext) => {
    const { security, elasticSearch } = context;
    /**
     * The user running this code MUST have full access to the system.
     */
    const hasFullAccess = await security.hasFullAccess();
    if (!hasFullAccess) {
        return new NotAuthorizedResponse();
    }
    /**
     * Create the Elasticsearch config to be used in index creation.
     */
    const esConfig = utils.es(context);
    /**
     * We need to check if given index already exists. If it does it means installation procedure was already done.
     * Fail with response in that case.
     */
    const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
    if (hasIndice) {
        return new ErrorResponse({
            message: "Already installed.",
            code: "IS_INSTALLED"
        });
    }
    /**
     * Try to create the Elasticsearch index.
     * Fail with ErrorResponse on any error.
     */
    try {
        await elasticSearch.indices.create({
            ...esConfig,
            body: {
                /**
                 * We need settings and mappings for sorting to work on text fields.
                 * You could not sort by title if this was not set on index creation.
                 */
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
                        }
                    }
                }
            }
        });
    } catch (ex) {
        return new ErrorResponse({
            message: "Could not create Elasticsearch index.",
            code: "ELASTICSEARCH_ERROR",
            data: ex
        });
    }
    return new Response(true);
};

export default install;
