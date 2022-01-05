import configurations from "~/operations/configurations";
import { Client } from "@elastic/elasticsearch";

export interface Params {
    elasticsearch: Client;
    tenant: string;
}
export const execOnBeforeInstall = async (params: Params): Promise<void> => {
    const { elasticsearch } = params;

    const { index } = configurations.es(params);

    const { body: exists } = await elasticsearch.indices.exists({ index });
    if (exists) {
        return;
    }

    await elasticsearch.indices.create({
        index,
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
};
