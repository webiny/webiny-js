import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";
import { japanese as japaneseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/japanese";

export const japanese = new CmsEntryElasticsearchIndexPlugin({
    body: {
        ...japaneseConfiguration
    },
    locales: ["ja", "ja-jp"]
});
