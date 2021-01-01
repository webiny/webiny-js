import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { Context } from "@webiny/handler/types";
import Error from "@webiny/error";

export type Options = {
    tenant?: boolean | string;
    locale?: boolean | string;
};

export default (context: Context<TenancyContext, I18NContentContext>, options: Options = {}) => {
    let prefix = "PB#";

    if (options.locale !== false) {
        let locale = options.locale;
        if (locale !== "string") {
            const { i18nContent } = context;
            locale = i18nContent.getLocale()?.code;
        }

        if (!locale) {
            throw new Error(
                `Cannot construct primary key - locale missing.`,
                "PB_CANNOT_CONSTRUCT_PK"
            );
        }
        prefix = `L#${locale}#${prefix}`;
    }

    if (options.tenant !== false) {
        let tenant = options.tenant;
        if (tenant !== "string") {
            const { security } = context;
            tenant = security.getTenant()?.id;
        }

        if (!tenant) {
            throw new Error(
                `Cannot construct primary key - tenant missing.`,
                "PB_CANNOT_CONSTRUCT_PK"
            );
        }
        prefix = `T#${tenant}#${prefix}`;
    }
    return prefix;
};
