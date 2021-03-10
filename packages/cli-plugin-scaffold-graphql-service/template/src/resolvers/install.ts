import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import { ApplicationContext } from "../types";

const install = async (_, __, context: ApplicationContext) => {
    const { security, elasticSearch } = context;
    const hasFullAccess = await security.hasFullAccess();
    if (!hasFullAccess) {
        return new ErrorResponse({
            message: "Not authorized.",
            code: "NOT_AUTHORIZED"
        });
    }
    const esConfig = configuration.es(context);
    const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
    if (hasIndice) {
        return new ErrorResponse({
            message: "Already installed.",
            code: "IS_INSTALLED"
        });
    }
    try {
        await elasticSearch.indices.create({
            ...esConfig,
            body: {
                // need this part for sorting to work on text fields
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
