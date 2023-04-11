import { getJapaneseConfiguration } from "@webiny/api-elasticsearch";

export const japanese = {
    body: getJapaneseConfiguration(),
    locales: ["ja", "ja-jp"]
};
