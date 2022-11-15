import { getBaseConfiguration } from "@webiny/api-elasticsearch";
import { FileElasticsearchIndexPlugin } from "~/plugins/FileElasticsearchIndexPlugin";

export const base = new FileElasticsearchIndexPlugin({
    body: getBaseConfiguration()
});
