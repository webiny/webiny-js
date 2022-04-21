import { base as baseGeneral } from "@webiny/api-elasticsearch/indexConfiguration/base";
import { CmsEntryElasticsearchIndexTemplatePlugin } from "~/plugins/CmsEntryElasticsearchIndexTemplatePlugin";

export const base = new CmsEntryElasticsearchIndexTemplatePlugin({
    name: "headless-cms-entries-index-default",
    order: 250,
    body: {
        ...baseGeneral,
        index_patterns: ["*-headless-cms-*"],
        aliases: {}
    }
});
