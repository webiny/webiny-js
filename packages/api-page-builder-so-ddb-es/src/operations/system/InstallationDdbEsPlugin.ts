import { PbContext } from "@webiny/api-page-builder/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import configurations from "~/operations/configurations";

export const installation = (): ContextPlugin<PbContext> => {
    return new ContextPlugin<PbContext>(async context => {
        /**
         * Add the elasticsearch index for the page builder.
         */
        context.pageBuilder.onBeforeInstall.subscribe(async () => {
            const { elasticsearch } = context;

            const { index } = configurations.es(context);

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
        });
    });
};
