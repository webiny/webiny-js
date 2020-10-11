import { applyContextPlugins } from "@webiny/graphql";
import models from "../plugins/models";
import { HandlerPlugin } from "@webiny/handler/types";

export default () => [
    {
        type: "handler",
        name: "handler-i18n-locales",
        async handle(context) {
            return [];
            context.plugins.register(models());
            await applyContextPlugins(context);

            const { I18NLocale } = context.models;
            const locales = await I18NLocale.find();
            return locales.map(locale => ({
                id: locale.id,
                code: locale.code,
                default: locale.default,
                createdOn: locale.createdOn
            }));
        }
    } as HandlerPlugin
];
