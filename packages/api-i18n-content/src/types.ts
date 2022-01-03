import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";

export interface I18NContentContext extends SecurityContext, I18NContext {
    i18nContent: {
        locale: I18NLocale;
        // getLocale: () => I18NLocale;
        getCurrentLocale: () => I18NLocale;
        hasI18NContentPermission: () => Promise<boolean>;
        checkI18NContentPermission: () => void;
    };
}
