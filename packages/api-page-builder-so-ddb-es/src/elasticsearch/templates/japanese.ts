import { japanese as baseJapanese } from "@webiny/api-elasticsearch/indexConfiguration/japanese";
import { PageElasticsearchIndexTemplatePlugin } from "~/plugins/definitions/PageElasticsearchIndexTemplatePlugin";

export const japanese = new PageElasticsearchIndexTemplatePlugin(
    {
        name: "page-builder-forms-index-japanese",
        order: 351,
        body: {
            ...baseJapanese,
            index_patterns: ["*-ja-jp-page-builder", "*-ja-page-builder"],
            aliases: {}
        }
    },
    ["ja", "ja-jp"]
);
