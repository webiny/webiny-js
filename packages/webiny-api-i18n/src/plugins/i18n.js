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
        apply: async (context: ApiContext) => {
            const self = {
                __i18n: {
                    acceptLanguage: null,
                    defaultLocale: null,
                    locales: {
                        list: [],
                        loaded: false
                    },
                    locale: {
                        instance: null,
                        loaded: false
                    }
                },
                async getDefaultLocale() {
                    const allLocales = await self.getLocales();
                    return allLocales.find(item => item.default === true);
                },
                async getLocale() {
                    if (self.__i18n.locale.loaded) {
                        return self.__i18n.locale.instance;
                    }

                    self.__i18n.locale.loaded = true;
                    const acceptLanguage = getAcceptLanguage(context.event.headers);
                    let allLocales = await self.getLocales();
                    self.__i18n.locale.instance = allLocales.find(
                        item => item.code === acceptLanguage
                    );
                    if (self.__i18n.locale.instance) {
                        return self.__i18n.locale.instance;
                    }

                    self.__i18n.locale.instance = await self.getDefaultLocale();
                    return this.__i18n.locale.instance;
                },
                async getLocales() {
                    if (self.__i18n.locales.loaded) {
                        return self.__i18n.locales.list;
                    }

                    self.__i18n.locales.loaded = true;

                    const { I18NLocale } = context.getEntities();
                    self.__i18n.locales.list = await I18NLocale.find();
                    return self.__i18n.locales.list;
                }
            };

            context.i18n = self;
        }
    }
]: Array<PluginType>);
