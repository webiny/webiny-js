import { ContextPlugin } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { I18NContentContext } from "../types";
import { SecurityContext } from "@webiny/api-security/types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasPermission from "../utils/hasI18NContentPermission";

export default () =>
    ({
        type: "context",
        apply(context) {
            context.i18nContent = {
                locale: context.i18n.getCurrentLocale("content"),
                getLocale: () => context.i18n.getCurrentLocale("content"),
                hasI18NContentPermission: async () => hasPermission(context),
                checkI18NContentPermission: async () => {
                    if (await context.i18nContent.hasI18NContentPermission()) {
                        return;
                    }

                    throw new NotAuthorizedError();
                }
            };
        }
    } as ContextPlugin<I18NContext, I18NContentContext, SecurityContext>);
