import { useContext } from "react";
import { I18NContext, I18NContextValue } from "../contexts/I18N";

type I18NValueObject = {
    value?: string;
    values?: Array<{ value: string; locale: string }>;
};

export function useI18N() {
    const context = useContext(I18NContext) as I18NContextValue;
    if (!context) {
        return null;
    }

    const { state, refetchLocales } = context;
    const self = {
        refetchLocales,
        getDefaultLocale() {
            return state.locales.find(item => item.default === true);
        },
        getLocale(id?: string) {
            if (id) {
                return self.getLocales().find(item => item.id === id);
            }

            return state.currentLocale;
        },
        getLocales() {
            return state.locales;
        },
        getValue(valueObject?: I18NValueObject, locale?: string): string {
            if (!valueObject) {
                return "";
            }
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
