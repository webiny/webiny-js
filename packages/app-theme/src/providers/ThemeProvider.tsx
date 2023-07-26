import * as React from "react";
import { useCallback, useState } from "react";
import { plugins } from "@webiny/plugins";
import { ThemePlugin } from "~/index";
import { Theme } from "~/types";
import { Global } from "@emotion/react";

export interface ThemeContext {
    theme: Theme | undefined;

    loadThemeFromPlugins(): void;
}

export interface ThemeProviderProps {
    children?: React.ReactChild | React.ReactChild[];
}

export const ThemeContext = React.createContext<ThemeContext | undefined>(undefined);

function tryLoadingTheme() {
    const [themePlugin] = plugins.byType<ThemePlugin>(ThemePlugin.type);
    return themePlugin?.theme as Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeContext["theme"]>(tryLoadingTheme());

    const loadThemeFromPlugins = useCallback(() => {
        const theme = tryLoadingTheme();

        if (theme) {
            setTheme(theme);
        }
    }, []);

    let render = (
        <ThemeContext.Provider
            value={{
                theme,
                loadThemeFromPlugins
            }}
        >
            {children}
        </ThemeContext.Provider>
    );

    const globalStyles = theme?.styles?.global;
    if (globalStyles) {
        render = (
            <>
                <Global styles={globalStyles} />
                {render}
            </>
        );
    }

    return render;
};
