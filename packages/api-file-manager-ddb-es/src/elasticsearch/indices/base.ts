import { base as baseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/base";
import { FileElasticsearchIndexPlugin } from "~/plugins/FileElasticsearchIndexPlugin";

export const base = new FileElasticsearchIndexPlugin({
    body: {
        ...baseConfiguration
    }
});
