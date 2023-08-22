import * as React from "react";
import { useState } from "react";
import { Theme } from "@webiny/app-theme/types";
import { theme as defaultTheme } from "./theme";

export interface ThemeContext {
    theme: Theme | undefined;
    setTheme: (theme: Theme) => void;
}

export interface ThemeProviderProps {
    children?: React.ReactChild | React.ReactChild[];
}

export const ThemeContext = React.createContext<ThemeContext | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(defaultTheme);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};
