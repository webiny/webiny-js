import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";
import { getBaseConfiguration } from "@webiny/api-elasticsearch";

export const base = new FormElasticsearchIndexPlugin({
    body: getBaseConfiguration()
});
