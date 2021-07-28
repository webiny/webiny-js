import { CmsContext } from "~/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

const extractHandlerHttpParameters = (context: CmsContext) => {
    const { key = "" } = context.http?.request?.path?.parameters || {};
    const [type, locale] = key.split("/");
    if (!type) {
        throw new WebinyError(`Missing context.http.request.path parameter "type".`);
    } else if (!locale) {
        throw new WebinyError(`Missing context.http.request.path parameter "locale".`);
    }

    return {
        type,
        locale
    };
};

export default () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (context.http?.request?.method === "OPTIONS") {
            return;
        } else if (context.cms) {
            throw new WebinyError(
                "Context setup plugin must be first to be registered. Cannot have anything before it.",
                "CMS_CONTEXT_INITIALIZED_ERROR"
            );
        }

        const { type, locale } = extractHandlerHttpParameters(context);

        const systemLocale = context.i18n.getLocale(locale);
        if (!systemLocale) {
            throw new WebinyError(`There is no locale "${locale}" in the system.`);
        }

        context.cms = {
            type,
            locale,
            getLocale: () => systemLocale,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage"
        } as any;
    });
};
