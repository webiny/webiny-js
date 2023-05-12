import { getBaseConfiguration } from "@webiny/api-elasticsearch";
import { PageElasticsearchIndexPlugin } from "~/plugins/definitions/PageElasticsearchIndexPlugin";

export const base = new PageElasticsearchIndexPlugin({
    body: getBaseConfiguration()
});

base.name = "pageBuilder.elasticsearch.index.page.default";
