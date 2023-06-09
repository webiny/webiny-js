import React from "react";
import { ThemePlugin as LegacyThemePlugin } from "@webiny/app-theme";
import { Theme } from "@webiny/theme/types";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

interface ThemePluginProps {
    theme: Theme;
}

export const ThemePlugin = createLegacyPlugin<ThemePluginProps, LegacyThemePlugin>(props => {
    return new LegacyThemePlugin(props.theme);
});
