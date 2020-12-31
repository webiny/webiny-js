import { I18NLocale } from "@webiny/api-i18n/types";
import { Context } from "@webiny/handler/types";
import { SecurityContext } from "@webiny/api-security/types";

export type I18NContentContext = Context<
    SecurityContext,
    {
        i18nContent: {
            locale: I18NLocale;
            getLocale: () => I18NLocale;
            hasI18NContentPermission: () => Promise<boolean>;
            checkI18NContentPermission: () => void;
        };
    }
>;
