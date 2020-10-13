import { ErrorResponse, Response } from "@webiny/graphql";
import { PK_LOCALE, LocaleData } from "../../models/i18n.model";

export const install = async (
    root: any,
    args: { [key: string]: any },
    context: { [key: string]: any }
) => {
    const { I18N } = context.models;

    try {
        const defaultLocale = new I18N();
        defaultLocale.PK = PK_LOCALE;
        defaultLocale.SK = args.data.code;
        defaultLocale.data = new LocaleData().populate({ code: args.data.code, default: true });
        await defaultLocale.save();
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }

    return new Response(true);
};

export const isInstalled = async (
    root: any,
    args: { [key: string]: any },
    context: { [key: string]: any }
) => {
    const { I18N } = context.models;

    // Check if at least 1 user exists in the system
    const localeCount = await I18N.findOne({ query: { PK: PK_LOCALE, SK: { $gt: " " } } });

    return new Response(Boolean(localeCount));
};
