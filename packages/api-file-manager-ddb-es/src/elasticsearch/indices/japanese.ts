import { FileElasticsearchIndexPlugin } from "~/plugins/FileElasticsearchIndexPlugin";
import { getJapaneseConfiguration } from "@webiny/api-elasticsearch";

export const japanese = new FileElasticsearchIndexPlugin({
    body: getJapaneseConfiguration(),
    locales: ["ja", "ja-jp"]
});
