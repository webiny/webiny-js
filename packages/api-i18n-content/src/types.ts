import { I18NLocale } from "@webiny/api-i18n/types";

export type I18NContentContext = {
    i18nContent: {
        locale: I18NLocale;
        getLocale: () => I18NLocale;
        hasI18NContentPermission: () => Promise<boolean>;
        checkI18NContentPermission: () => void;
    };
};
