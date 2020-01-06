import { useContext } from "react";
import { ThemeContext, ThemeContextValue } from "../contexts/Theme";

export const useTheme = (): ThemeContextValue => {
    return useContext(ThemeContext);
};
