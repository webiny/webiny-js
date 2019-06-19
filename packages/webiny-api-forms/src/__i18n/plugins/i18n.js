// @flow
import type { PluginType } from "webiny-plugins/types";
import type { I18NContext } from "webiny-api-forms/__i18n/types";
import type { ApiContext } from "webiny-api/types";

export default ([
    {
        type: "graphql-context",
        name: "graphql-context-i18n",
        preApply: async (context: Object) => {
            const i18n = {
                acceptLanguage: null,
                defaultLocale: null,
                getLocale() {
                    return i18n.acceptLanguage || i18n.defaultLocale;
                }
            };

            context.i18n = i18n;
        },
        postApply: async (context: ApiContext & I18NContext) => {
            context.i18n.defaultLocale = "en-US";
            // TODO: Load default Locale and set it into "i18n.defaultLocale";
            // const { I18NLocale } = context.getEntities();
            // const defaultLocale = await I18NLocale.findOne({ query: { default: true } });
        }
    }
]: Array<PluginType>);
