// @flow
import type { PluginType } from "webiny-plugins/types";
import type { ApiContext } from "webiny-api/types";
import acceptLanguageParser from "accept-language-parser";

export default ([
    {
        type: "graphql-context",
        name: "graphql-context-i18n",
        apply: async (context: ApiContext & Object) => {
            const { I18NLocale } = context.getEntities();

            const self = {
                __i18n: {
                    acceptLanguage: null,
                    defaultLocale: null,
                    locales: await I18NLocale.find(),
                    locale: null
                },
                getDefaultLocale() {
                    const allLocales = self.getLocales();
                    return allLocales.find(item => item.default === true);
                },
                getLocale() {
                    if (self.__i18n.locale) {
                        return self.__i18n.locale;
                    }

                    let allLocales = self.getLocales();
                    const acceptLanguage = acceptLanguageParser.pick(
                        allLocales.map(item => item.code),
                        context.event.headers["accept-language"]
                    );

                    let currentLocale;
                    if (acceptLanguage) {
                        currentLocale = allLocales.find(item => item.code === acceptLanguage);
                    }

                    if (!currentLocale) {
                        currentLocale = self.getDefaultLocale();
                    }

                    // $FlowFixMe
                    self.__i18n.locale = currentLocale;
                    return self.__i18n.locale;
                },
                getLocales() {
                    return self.__i18n.locales;
                }
            };

            context.i18n = self;
        }
    }
]: Array<PluginType>);
