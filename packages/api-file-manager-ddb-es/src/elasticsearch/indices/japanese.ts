import { FileElasticsearchIndexPlugin } from "~/plugins/FileElasticsearchIndexPlugin";
import { japanese as japaneseConfiguration } from "@webiny/api-elasticsearch/indexConfiguration/japanese";

export const japanese = new FileElasticsearchIndexPlugin({
    body: {
        ...japaneseConfiguration
    },
    locales: ["ja", "ja-jp"]
});
