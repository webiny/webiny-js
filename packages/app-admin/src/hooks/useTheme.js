import { useContext } from "react";
import { ThemeContext } from "../contexts/Theme";

export const useTheme = () => {
    return useContext(ThemeContext);
};
