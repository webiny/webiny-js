import { useContext } from "react";
import { ThemeContext } from "~/providers/ThemeProvider";
export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw Error(
            `Theme context was not found! Are you using the "useTheme()" hook in the right place?`
        );
    }

    return context;
}
