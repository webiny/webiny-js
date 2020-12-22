import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { Context } from "@webiny/handler/types";
import Error from "@webiny/error";

type Options = {
    includeTenant?: boolean;
    includeLocale?: boolean;
};

export default (context: Context<TenancyContext, I18NContentContext>, options: Options = {}) => {
    let prefix = "PB#";
    if (!options.includeTenant && !options.includeLocale) {
        return prefix;
    }

    if (options.includeLocale !== false) {
        const { i18nContent } = context;
        if (!i18nContent.getLocale()) {
            throw new Error(
                `Cannot construct primary key - locale missing.`,
                "PAGE_BUILDER_CANNOT_CONSTRUCT_PK"
            );
        }
        prefix = `L#${i18nContent.getLocale().code}#${prefix}`;
    }

    if (options.includeTenant !== false) {
        const { security } = context;
        if (!security.getTenant()) {
            throw new Error(
                `Cannot construct primary key - tenant missing.`,
                "PAGE_BUILDER_CANNOT_CONSTRUCT_PK"
            );
        }
        prefix = `T#${security.getTenant().id}#${prefix}`;
    }

    return prefix;
};
