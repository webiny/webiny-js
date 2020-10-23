import { HandlerPlugin } from "@webiny/handler/types";
import crud from "./../plugins/crud";

export default () => [
    crud,
    {
        type: "handler",
        name: "handler-i18n-locales",
        async handle(context) {
            const { locales } = context;
            const list = await locales.list();
            return list.map(locale => ({
                code: locale.code,
                default: locale.default
            }));
        }
    } as HandlerPlugin
];
