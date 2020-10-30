import { I18NLocale } from "@webiny/api-i18n/types";

export type HandlerI18NContentContext = {
    getContentLocale: () => I18NLocale;
};
