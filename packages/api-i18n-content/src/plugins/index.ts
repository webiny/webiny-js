import hasPermission from "../utils/hasI18NContentPermission";
import { I18NContentContext } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { ContextPlugin } from "@webiny/handler";
import { I18NLocale } from "@webiny/api-i18n/types";

export default () => {
    return new ContextPlugin<I18NContentContext>(async context => {
        const getCurrentLocale = (): I18NLocale | null => {
            return context.i18n.getCurrentLocale("content");
        };
        context.i18nContent = {
            locale: getCurrentLocale(),
            getCurrentLocale: () => {
                return getCurrentLocale();
            },
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
