import { japanese as baseJapanese } from "@webiny/api-elasticsearch/indexConfiguration/japanese";
import { FormElasticsearchIndexTemplatePlugin } from "~/plugins/FormElasticsearchIndexTemplatePlugin";

export const japanese = new FormElasticsearchIndexTemplatePlugin(
    {
        name: "form-builder-forms-index-japanese",
        order: 151,
        body: {
            ...baseJapanese,
            index_patterns: ["*-ja-jp-form-builder", "*-ja-form-builder"],
            aliases: {}
        }
    },
    ["ja", "ja-jp"]
);
