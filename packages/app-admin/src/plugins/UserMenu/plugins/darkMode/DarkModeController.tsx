import { useEffect } from "react";
import { useUi } from "@webiny/app/hooks/useUi";
import store from "store";
import observe from "store/plugins/observe";
store.addPlugin(observe);

export const LOCAL_STORAGE_KEY = "webiny_dark_mode";

export const DarkModeController = () => {
    const { setState, darkMode } = useUi();

    useEffect(() => {
        store.observe(LOCAL_STORAGE_KEY, (theme: boolean) => {
            setState(state => {
                return {
                    ...state,
                    darkMode: Boolean(theme)
                };
            });
        });
    }, []);

    useEffect(() => {
        if (!darkMode) {
            window.document.body.classList.remove("dark-theme");
        } else {
            window.document.body.classList.add("dark-theme");
        }
    }, [darkMode]);

    return null;
};
