import { useEffect } from "react";
import { useTheme } from "./useTheme.js";

/**
 * Applies the selected theme by setting `data-theme` on `<html>`, which activates the
 * matching token overrides defined in `@webiny/admin-ui` theme.css. For the "light" theme
 * no overrides match, so the default (light) palette is used. Renders nothing.
 *
 * This mirrors how `AdminConfig/Theme/assignColor.ts` mutates `document.documentElement`
 * for brand color customization.
 */
export const ThemeModeApplier = () => {
    const { theme } = useTheme();

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return null;
};
