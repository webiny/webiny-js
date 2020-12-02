import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { Context } from "@webiny/handler/types";

export default (context: Context<TenancyContext, I18NContentContext>) => {
    const { security, i18nContent } = context;
    if (!security.getTenant()) {
        throw new Error("Tenant missing.");
    }

    if (!i18nContent.getLocale()) {
        throw new Error("Locale missing.");
    }

    return `T#${security.getTenant().id}#L#${i18nContent.getLocale().code}#PB#`;
};
