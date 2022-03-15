import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";

/**
 * @deprecated
 */
export type BaseI18NContentContext = I18NContentContext;

export interface I18NContentContext extends SecurityContext, I18NContext {
    i18nContent: {
        locale: I18NLocale | null;
        getCurrentLocale: () => I18NLocale | null;
        hasI18NContentPermission: () => Promise<boolean>;
        checkI18NContentPermission: () => void;
    };
}
