import React, { createContext, useCallback, useMemo, useState } from "react";
import { HigherOrderComponent } from "@webiny/app-admin";
import { ThemeSource } from "~/types";

export interface ThemeManagerContext {
    themes: ThemeSource[];
    addTheme(theme: ThemeSource): void;
}

export const ThemeManagerContext = createContext<ThemeManagerContext>({
    themes: [],
    addTheme: () => {
        return void 0;
    }
});
ThemeManagerContext.displayName = "ThemeManagerContext";

export const ThemeManagerProviderHOC: HigherOrderComponent<unknown> = PreviousProvider => {
    return function ThemeProvider({ children }) {
        const [themes, setThemes] = useState<ThemeSource[]>([]);

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
