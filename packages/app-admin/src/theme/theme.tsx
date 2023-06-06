import { plugins } from "@webiny/plugins";
import { Theme } from "@webiny/app-theme/types";
import { ThemePlugin } from "@webiny/app-theme";

const loadTheme = (): Theme => {
    const [firstThemePlugin] = plugins.byType<ThemePlugin>(ThemePlugin.type);
    const themePlugin = firstThemePlugin;
    return (themePlugin?.theme as Theme) || undefined;
};

export const theme = loadTheme();
