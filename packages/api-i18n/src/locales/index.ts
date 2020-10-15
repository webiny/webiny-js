import models from "../plugins/models";
import { HandlerPlugin } from "@webiny/handler/types";
import { PK_LOCALE } from "../plugins/models/localeData.model";

export default () => [
    models(),
    {
        type: "handler",
        name: "handler-i18n-locales",
        async handle(context) {
            const { I18N } = context.models;
            const locales = await I18N.find({ query: { PK: PK_LOCALE, SK: { $gt: " " } } });

            return locales.map(locale => ({
                id: locale.id,
                code: locale.code,
                default: locale.default,
                createdOn: locale.createdOn
            }));
        }
    } as HandlerPlugin,

];
