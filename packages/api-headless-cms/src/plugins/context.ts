import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";

const DEFAULT_LOCALE_CODE = "en-US";

export default () => {
    return new ContextPlugin<CmsContext>(context => {
        context.cms = {
            ...(context.cms || ({} as any)),
            get locale() {
                const locale = context.i18n.getContentLocale();

                return locale ? locale.code : DEFAULT_LOCALE_CODE;
            },
            getLocale() {
                const locale = context.i18n.getContentLocale();

                if (!locale) {
                    return {
                        code: DEFAULT_LOCALE_CODE,
                        default: true
                    };
                }
                return locale;
            }
        };
    });
};
