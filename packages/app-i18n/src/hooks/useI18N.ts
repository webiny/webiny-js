import { useContext } from "react";
import { I18NContext, I18NContextValue } from "../contexts/I18N";

type I18NValueObject = {
    value?: string;
    values?: Array<{ value: string; locale: string }>;
};

export function useI18N() {
    const context = useContext<I18NContextValue>(I18NContext);

    const { state, setState, refetchLocales, updateLocaleStorage } = context;
    const self = {
        refetchLocales,
        getDefaultLocale() {
            return state.locales.find(item => item.default === true);
        },
        getCurrentLocales() {
            return state.currentLocales;
        },
        getCurrentLocale(localeContext = "default") {
            return state.currentLocales.find(locale => locale.context === localeContext)?.locale;
        },
        getLocale(...args) {
            return self.getCurrentLocale(...args);
        },
        setCurrentLocale(code, localeContext = "default") {
            const newCurrentLocales = [...self.getCurrentLocales()];
            for (let i = 0; i < newCurrentLocales.length; i++) {
                const item = newCurrentLocales[i];
                if (item.context === localeContext) {
                    item.locale = code;
                    break;
                }
            }

            updateLocaleStorage(newCurrentLocales);

            setState(prev => {
                const next = { ...prev };
                next.currentLocales = newCurrentLocales;
                return next;
            });
        },
        getLocales() {
            return state.locales;
        },
        // @ts-ignore TODO: remove this
        getValue(valueObject?: I18NValueObject, locale?: string): string {
            if (!valueObject) {
                return "";
            }
            // @ts-ignore
            locale = locale || self.getLocale().id;
            if (Array.isArray(valueObject.values)) {
                const output = valueObject.values.find(item => item.locale === locale);
                return output ? output.value : "";
            }

            return valueObject.value || "";
        },
        state
    };

    return self;
}
