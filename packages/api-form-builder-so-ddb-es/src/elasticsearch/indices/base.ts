import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";
import { base as baseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/base";

export const base = new FormElasticsearchIndexPlugin({
    body: {
        ...baseConfiguration
    }
});
