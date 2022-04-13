import { FileElasticsearchIndexTemplatePlugin } from "~/plugins/FileElasticsearchIndexTemplatePlugin";
import { japanese as baseJapanese } from "@webiny/api-elasticsearch/indexConfiguration/japanese";

export const japanese = new FileElasticsearchIndexTemplatePlugin(
    {
        name: "file-manager-files-index-japanese",
        order: 51,
        body: {
            ...baseJapanese,
            index_patterns: ["*-ja-jp-file-manager", "*-ja-file-manager"],
            aliases: {}
        }
    },
    ["ja", "ja-jp"]
);
