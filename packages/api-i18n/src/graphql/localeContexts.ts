import { I18NLocaleContextPlugin } from "@webiny/api-i18n/types";

export default [
    {
        type: "i18n-locale-context",
        context: {
            name: "default"
        }
    },
    {
        type: "i18n-locale-context",
        context: {
            name: "content"
        }
    }
] as I18NLocaleContextPlugin[];
