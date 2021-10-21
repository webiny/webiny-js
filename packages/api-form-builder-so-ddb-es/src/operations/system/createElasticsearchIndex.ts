import { Client } from "@elastic/elasticsearch";
import configurations from "~/configurations";

export interface Params {
    elasticsearch: Client;
    tenant: string;
}

export const createElasticsearchIndex = async (params: Params) => {
    const { tenant, elasticsearch } = params;

    const esIndex = configurations.es({
        tenant
    });

    const { body: exists } = await elasticsearch.indices.exists(esIndex);
    if (exists) {
        return;
    }
    await elasticsearch.indices.create({
        ...esIndex,
        body: {
            /**
             * need this part for sorting to work on text fields
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
};
