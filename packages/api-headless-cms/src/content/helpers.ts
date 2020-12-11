import { Context } from "@webiny/handler/types";

export type CmsHttpParametersType = {
    type: string;
    environment: string;
    locale: string;
};
const throwPlainError = (type: string): void => {
    throw new Error(`Missing context.http.path.parameter "${type}".`);
};
const throwRegexError = (type: string, regex: string): void => {
    throw new Error(`Parameter part "${type}" does not match a "${regex}" regex.`);
};
export const extractHandlerHttpParameters = (context: Context): CmsHttpParametersType => {
    const { key = "" } = context.http.path.parameters || {};
    const [type, environment, locale] = key.split("/");
    if (!type) {
        throwPlainError("type");
    } else if (!environment) {
        throwPlainError("environment");
    } else if (environment.match(/^([a-zA-Z0-9\-]+)$/) === null) {
        throwRegexError("environment", "^([a-zA-Z0-9\\-]+)$");
    } else if (!locale) {
        throwPlainError("locale");
    } else if (locale.match(/^([a-zA-Z]{2})-([a-zA-Z]{2})$/) === null) {
        throwRegexError("locale", "^([a-zA-Z]{2})-([a-zA-Z]{2})$");
    }
    return {
        type,
        environment,
        locale
    };
};
