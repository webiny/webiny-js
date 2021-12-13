import hasPermission from "../utils/hasI18NContentPermission";
import { I18NContentContext } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

export default () => {
    return new ContextPlugin<I18NContentContext>(async context => {
        context.i18nContent = {
            locale: context.i18n.getCurrentLocale("content"),
            // getLocale: () => context.i18n.getCurrentLocale("content"),
            getCurrentLocale: () => context.i18n.getCurrentLocale("content"),
            hasI18NContentPermission: async () => hasPermission(context),
            checkI18NContentPermission: async () => {
                if (await context.i18nContent.hasI18NContentPermission()) {
                    return;
                }

                throw new NotAuthorizedError();
            }
        };
    });
};
