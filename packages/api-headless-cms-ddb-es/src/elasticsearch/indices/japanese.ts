import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin.js";
import { getJapaneseConfiguration } from "@webiny/api-elasticsearch";

export const japanese = new CmsEntryElasticsearchIndexPlugin({
    body: getJapaneseConfiguration()
});
