import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";
import { getJapaneseConfiguration } from "@webiny/api-elasticsearch";

export const japanese = new CmsEntryElasticsearchIndexPlugin({
    body: getJapaneseConfiguration(),
    locales: ["ja", "ja-jp"]
});
