import { ErrorResponse, Response } from "@webiny/graphql";

export const install = async (
    root: any,
    args: { [key: string]: any },
    context: { [key: string]: any }
) => {
    const { locales } = context;

    try {
        await locales.create({ code: args.data.code, default: true });
        await locales.updateDefault(args.data.code);
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
    const { locales } = context;
    const defaultLocale = await locales.getDefault();
    return new Response(Boolean(defaultLocale));
};
