import { useContext } from "react";
import { ThemeManagerContext } from "~/modules/themes/ThemeManagerProvider";

export function useThemeManager() {
    return useContext(ThemeManagerContext);
}
