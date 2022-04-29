import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";

/**
 * @deprecated
 */
export type BaseI18NContentContext = I18NContentContext;

/**
 * @deprecated Use `I18NContext` from `@webiny/api-i18n` package instead.
 */
export interface I18NContentContext extends SecurityContext, I18NContext {
    /**
     * @deprecated Use `context.i18n` instead.
     */
    i18nContent: {
        /**
         * @deprecated Use `context.i18n.getContentLocale()` instead.
         */
        getCurrentLocale: () => I18NLocale | undefined;
        /**
         * @deprecated Use `context.i18n.hasI18NContentPermission()` instead.
         */
        hasI18NContentPermission: () => Promise<boolean>;
        /**
         * @deprecated Use `context.i18n.checkI18NContentPermission()` instead.
         */
        checkI18NContentPermission: () => void;
    };
}
