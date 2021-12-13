import { I18NLocale } from "@webiny/api-i18n/types";
import { Context } from "@webiny/handler/types";
import { SecurityContext } from "@webiny/api-security/types";

export interface BaseI18NContentContext {
    i18nContent: {
        locale: I18NLocale;
        // getLocale: () => I18NLocale;
        getCurrentLocale: () => I18NLocale;
        hasI18NContentPermission: () => Promise<boolean>;
        checkI18NContentPermission: () => void;
    };
}

export type I18NContentContext = Context<SecurityContext, BaseI18NContentContext>;
