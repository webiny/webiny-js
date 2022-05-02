import { base as baseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/base";
import { PageElasticsearchIndexPlugin } from "~/plugins/definitions/PageElasticsearchIndexPlugin";

export const base = new PageElasticsearchIndexPlugin({
    body: {
        ...baseConfiguration
    }
});
