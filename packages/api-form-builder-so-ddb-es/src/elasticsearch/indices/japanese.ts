import { getJapaneseConfiguration } from "@webiny/api-elasticsearch";
import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";

export const japanese = new FormElasticsearchIndexPlugin({
    body: getJapaneseConfiguration(),
    locales: ["ja", "ja-jp"]
});
