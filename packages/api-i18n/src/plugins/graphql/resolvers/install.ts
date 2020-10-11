import { ErrorResponse, Response } from "@webiny/graphql";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import { PK_LOCALE } from "../../models/i18n.model";

export const install = async (
    root: any,
    args: { [key: string]: any },
    context: { [key: string]: any }
) => {
    const { I18NLocale } = context.models;

    try {
        const defaultLocale = new I18NLocale();
        defaultLocale.code = args.data.code;
        defaultLocale.default = true;
        await defaultLocale.save();
    } catch (e) {
        if (e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS) {
            const attrError = InvalidFieldsError.from(e);
            return new ErrorResponse({
                code: attrError.code || WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS,
                message: attrError.message,
                data: attrError.data
            });
        }
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
