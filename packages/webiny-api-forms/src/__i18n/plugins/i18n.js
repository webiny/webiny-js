// @flow
import type { PluginType } from "webiny-plugins/types";
import type { ApiContext } from "webiny-api/types";

export default ([
    {
        type: "graphql-context",
        name: "graphql-context-i18n",
        preApply: async (context: ApiContext) => {
            const i18n = {
                acceptLanguage: null,
                defaultLocale: "en-US",
                locales: ["en-US", "de-DE", "hr-HR"], // TODO: load.
                async getLocale() {
                    // TODO: load default Locale and set it into "i18n.defaultLocale".
                    // const { I18NLocale } = context.getEntities();
                    // const defaultLocale = await I18NLocale.findOne({ query: { default: true } });
                    return i18n.acceptLanguage || i18n.defaultLocale;
                },
                async getLocales() {
                    if (i18n.locales) {
                        return i18n.locales;
                    }

                    // TODO: load list of locales
                    // const { I18NLocale } = context.getEntities();
                    // await I18NLocale.find({enabled: true})
                    // i18n.locales =
                    return i18n.locales;
                }
            };

            context.i18n = i18n;
        }
    }
]: Array<PluginType>);
