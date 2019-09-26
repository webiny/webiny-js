import { useContext } from "react";
import { I18NContext } from "../contexts/I18N";

export function useI18N() {
    const context = useContext(I18NContext);
    if (!context) {
        return null;
    }

    const { state, dispatch } = context;
    const self = {
        getDefaultLocale() {
            return state.locales.find(item => item.default === true);
        },
        getLocale(id: ?string) {
            if (id) {
                return self.getLocales().find(item => item.id === id);
            }

            return state.currentLocale;
        },
        getLocales() {
            return state.locales;
        },
        getValue(valueObject: ?Object): string {
            if (!valueObject) {
                return "";
            }

            if (Array.isArray(valueObject.values)) {
                const output = valueObject.values.find(item => item.locale === self.getLocale().id);
                return output ? output.value : "";
            }

            return valueObject.value || "";
        },
        state,
        dispatch
    };

    return self;
}
