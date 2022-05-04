import { japanese as japaneseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/japanese";
import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";

export const japanese = new FormElasticsearchIndexPlugin({
    body: {
        ...japaneseConfiguration
    },
    locales: ["ja", "ja-jp"]
});
