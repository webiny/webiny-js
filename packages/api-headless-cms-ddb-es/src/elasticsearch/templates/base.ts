import { CmsEntryElasticsearchIndexTemplatePlugin } from "~/plugins/CmsEntryElasticsearchIndexTemplatePlugin";

export const base = new CmsEntryElasticsearchIndexTemplatePlugin({
    name: "headless-cms-entries-index-default",
    order: 250,
    body: {
        index_patterns: ["*-headless-cms-*"],
        aliases: {},
        settings: {
            index: {
                analysis: {
                    analyzer: {
                        lowercase_analyzer: {
                            type: "custom",
                            filter: ["lowercase", "trim"],
                            tokenizer: "keyword"
                        }
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
