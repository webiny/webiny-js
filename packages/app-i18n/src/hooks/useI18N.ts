import { useContext } from "react";
import { I18NContext, I18NContextValue } from "../contexts/I18N";
import { I18NCurrentLocaleItem, I18NLocaleItem } from "~/types";

interface UseI18NHook {
    refetchLocales: I18NContextValue["refetchLocales"];
    state: I18NContextValue["state"];
    getDefaultLocale(): I18NLocaleItem | null;
    getCurrentLocales(): I18NCurrentLocaleItem[];
    getCurrentLocale(localeContext: string): string | null;
    getLocale(localeContext: string): string | null;
    setCurrentLocale(code: string, localeContext: string): void;
    getLocales(): I18NLocaleItem[];
}
export function useI18N(): UseI18NHook {
    const context = useContext<I18NContextValue>(I18NContext);

    const { state, setState, refetchLocales, updateLocaleStorage } = context || {};
    const self: UseI18NHook = {
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
        getLocale(localeContext: string) {
            return self.getCurrentLocale(localeContext);
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

            setState({
                currentLocales: newCurrentLocales
            });
        },
        getLocales() {
            return state.locales;
        },
        state
    };

    return self;
}
