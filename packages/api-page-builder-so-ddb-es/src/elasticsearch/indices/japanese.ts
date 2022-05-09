import { japanese as japaneseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/japanese";
import { PageElasticsearchIndexPlugin } from "~/plugins/definitions/PageElasticsearchIndexPlugin";

export const japanese = new PageElasticsearchIndexPlugin({
    body: {
        ...japaneseConfiguration
    },
    locales: ["ja", "ja-jp"]
});
