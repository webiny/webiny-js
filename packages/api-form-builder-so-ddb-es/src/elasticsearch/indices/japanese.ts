import { japanese as baseJapanese } from "@webiny/api-elasticsearch/indexConfiguration/japanese";
import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";

export const japanese = new FormElasticsearchIndexPlugin({
    body: baseJapanese,
    locales: ["ja", "ja-jp"]
});
