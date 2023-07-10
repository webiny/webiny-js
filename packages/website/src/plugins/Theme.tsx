import React from "react";
import { ThemePlugin as LegacyThemePlugin } from "@webiny/app-theme";
import { Theme as WTheme } from "@webiny/theme/types";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

interface ThemeProps {
    theme: WTheme;
}

export const Theme = createLegacyPlugin<ThemeProps, LegacyThemePlugin>(props => {
    return new LegacyThemePlugin(props.theme);
});
