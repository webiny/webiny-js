import { CmsEntryElasticsearchIndexTemplatePlugin } from "~/plugins/CmsEntryElasticsearchIndexTemplatePlugin";
import { japanese as baseJapanese } from "@webiny/api-elasticsearch/indexConfiguration/japanese";

export const japanese = new CmsEntryElasticsearchIndexTemplatePlugin(
    {
        name: "headless-cms-entries-index-japanese",
        order: 251,
        body: {
            ...baseJapanese,
            index_patterns: ["*-ja-jp-headless-cms-*", "*-ja-headless-cms-*"],
            aliases: {}
        }
    },
    ["ja", "ja-jp"]
);
