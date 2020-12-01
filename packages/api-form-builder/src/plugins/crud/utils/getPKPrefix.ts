import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityContext } from "@webiny/api-security/types";
import { HandlerContext } from "@webiny/handler/types";

export default (context: HandlerContext<SecurityContext, I18NContentContext>) => {
    const { security, i18nContent } = context;
    if (!security.getTenant()) {
        throw new Error("Tenant missing.");
    }

    if (!i18nContent.getLocale()) {
        throw new Error("Locale missing.");
    }

    return `T#${security.getTenant().id}#L#${i18nContent.getLocale().id}#FB#`;
};
