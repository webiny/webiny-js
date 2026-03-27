import { getBaseConfiguration } from "@webiny/api-opensearch";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin.js";

export const base = new CmsEntryElasticsearchIndexPlugin({
    body: getBaseConfiguration()
});
