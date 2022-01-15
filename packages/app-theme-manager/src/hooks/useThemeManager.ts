import { useContext } from "react";
import { ThemeManagerContext } from "~/components/ThemeManagerProvider";

export function useThemeManager() {
    return useContext(ThemeManagerContext);
}
