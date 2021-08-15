import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { CmsContext } from "~/types";

export default () => {
    return new ContextPlugin<CmsContext>(context => {
        const locale = context.i18n.getCurrentLocale();

        context.cms = {
            ...(context.cms || ({} as any)),
            locale: locale ? locale.code : "en-US",
            getLocale() {
                return locale || { code: "en-US" };
            }
        };
    });
};
