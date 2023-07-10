import React from "react";
import { ThemePlugin as LegacyThemePlugin } from "@webiny/app-theme";
import { Theme } from "@webiny/theme/types";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

interface ThemeProps {
    theme: Theme;
}

export const Theme = createLegacyPlugin<ThemeProps, LegacyThemePlugin>(props => {
    return new LegacyThemePlugin(props.theme);
});
