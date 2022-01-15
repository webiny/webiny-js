import React, { createContext, useCallback, useMemo, useState } from "react";

export interface Theme {
    name: string;
    label: string;
    load: () => Promise<any>;
}

export interface ThemeManagerContext {
    themes: any[];
    addTheme(theme: Theme): void;
}

export const ThemeManagerContext = createContext<ThemeManagerContext>(null);
ThemeManagerContext.displayName = "ThemeManagerContext";

export const ThemeManagerProviderHOC = PreviousProvider => {
    return function ThemeProvider({ children }) {
        const [themes, setThemes] = useState([]);

        const addTheme = useCallback(
            theme => {
                setThemes(themes => [...themes, theme]);

                return () => {
                    setThemes(themes => {
                        const index = themes.findIndex(theme);
                        if (index > -1) {
                            return [...themes.slice(0, index), ...themes.slice(index + 1)];
                        }

                        return themes;
                    });
                };
            },
            [setThemes]
        );

        const context = useMemo(
            () => ({
                themes,
                addTheme
            }),
            [themes]
        );

        return (
            <ThemeManagerContext.Provider value={context}>
                <PreviousProvider>{children}</PreviousProvider>
            </ThemeManagerContext.Provider>
        );
    };
};
