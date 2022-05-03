import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";
import { japanese as baseJapanese } from "@webiny/api-elasticsearch/indexConfiguration/japanese";

export const japanese = new CmsEntryElasticsearchIndexPlugin({
    body: baseJapanese,
    locales: ["ja", "ja-jp"]
});
