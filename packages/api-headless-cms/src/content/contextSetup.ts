import { Context, ContextPlugin } from "@webiny/handler/types";
import { CmsContext } from "@webiny/api-headless-cms/types";

interface CmsHttpParameters {
    type: string;
    locale: string;
}

const throwPlainError = (type: string): void => {
    throw new Error(`Missing context.http.path.parameter "${type}".`);
};

export const extractHandlerHttpParameters = (context: Context): CmsHttpParameters => {
    const { key = "" } = context.http.path.parameters || {};
    const [type, locale] = key.split("/");
    if (!type) {
        throwPlainError("type");
    } else if (!locale) {
        throwPlainError("locale");
    }

    return {
        type,
        locale
    };
};

const setContextCmsVariables = async (context: CmsContext): Promise<void> => {
    const locale = await context.i18n.getLocale(context.cms.locale);
    if (!locale) {
        throw new Error(`There is no locale "${context.cms.locale}" in the system.`);
    }
    context.cms.getLocale = () => locale;

    // Need to load settings because of the timestamp of last change to content models.
    // Based on that timestamp, we cache/refresh the schema definition.
    const settings = await context.cms.settings.noAuth().get();
    context.cms.getSettings = () => ({
        ...settings,
        contentModelLastChange: context.cms.settings.contentModelLastChange
    });
};
// eslint-disable-next-line
export default (options: any = {}): ContextPlugin<CmsContext> => ({
    type: "context",
    apply: async context => {
        if (context.http.request.method === "OPTIONS") {
            return;
        }

        const { type, locale } = extractHandlerHttpParameters(context);

        context.cms = {
            ...(context.cms || ({} as any)),
            type,
            locale,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage"
        };

        await setContextCmsVariables(context);
    }
});
