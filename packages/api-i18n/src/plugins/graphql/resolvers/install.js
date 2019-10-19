import { ErrorResponse, Response } from "@webiny/api";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";

export const install = async (root: any, args: Object, context: Object) => {
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

export const isInstalled = async (root: any, args: Object, context: Object) => {
    const { I18NLocale } = context.models;

    // Check if at least 1 user exists in the system
    const localeCount = await I18NLocale.count();

    return new Response(localeCount > 0);
};
