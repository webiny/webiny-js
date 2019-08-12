// @flow
import type { PluginType } from "webiny-plugins/types";
import type { ApiContext } from "webiny-api/types";
import acceptLanguageParser from "accept-language-parser";

export default ([
    {
        type: "graphql-context",
        name: "graphql-context-i18n",
        apply: async (context: ApiContext & Object) => {
            const { event, getDatabase } = context;
            const self = {
                __i18n: {
                    acceptLanguage: null,
                    defaultLocale: null,
                    locale: null,
                    locales: await getDatabase()
                        .collection("I18NLocale")
                        .find({ deleted: { $ne: true } })
                        .project({ _id: 0, id: 1, default: 1, code: 1 })
                        .toArray()
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
                        event.headers["accept-language"]
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
                },
                getValue(value) {
                    if (!value) {
                        return "";
                    }

                    if (Array.isArray(value.values)) {
                        const locale = self.getLocale();
                        const valuesValue = value.values.find(value => value.locale === locale.id);
                        return valuesValue ? valuesValue.value : "";
                    }

                    return value.value || "";
                }
            };

            context.i18n = self;
        }
    }
]: Array<PluginType>);
