import { getBaseConfiguration } from "@webiny/api-elasticsearch";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";

export const base = new CmsEntryElasticsearchIndexPlugin({
    body: getBaseConfiguration()
});
