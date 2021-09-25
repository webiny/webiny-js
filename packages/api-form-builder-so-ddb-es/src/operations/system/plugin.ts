import { FormBuilderSystemPlugin } from "@webiny/api-form-builder/plugins/definitions/FormBuilderSystemPlugin";
import configurations from "~/configurations";
import { Client } from "@elastic/elasticsearch";

interface Params {
    elasticsearch: Client;
}

/**
 * We need to create the plugin like this because it does not know of elasticsearch and we create the plugin on load time.
 * The plugin type accepts tenant and system objects because they are created on runtime.
 */
export const createSystemPlugin = ({ elasticsearch }: Params) => {
    return new FormBuilderSystemPlugin({
        afterInstall: async ({ tenant }) => {
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
        }
    });
};
