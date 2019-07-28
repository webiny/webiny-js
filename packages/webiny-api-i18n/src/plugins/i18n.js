// @flow
import type { PluginType } from "webiny-plugins/types";
import type { ApiContext } from "webiny-api/types";

const getAcceptLanguage = headers => {
    if (typeof headers["accept-language"] !== "string") {
        return null;
    }

    const match = headers["accept-language"].match(/[a-z]{2}-[A-Z]{2}/);
    return match ? match[0] : null;
};

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

                    const acceptLanguage = getAcceptLanguage(context.event.headers);
                    let allLocales = self.getLocales();

                    let currentLocale = allLocales.find(item => item.code === acceptLanguage);
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
