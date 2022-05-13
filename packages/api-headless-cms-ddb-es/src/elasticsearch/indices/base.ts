import { base as baseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/base";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";

export const base = new CmsEntryElasticsearchIndexPlugin({
    body: {
        ...baseConfiguration
    }
});
