import React, { memo } from "react";
import { ThemesModule } from "./modules/themes";
import { ThemeSource } from "~/types";
export type { ThemeSource } from "~/types";
export { AddTheme } from "./components/AddTheme";
export { ThemeLoader } from "./components/ThemeLoader";
export { useThemeManager } from "./hooks/useThemeManager";
export { useTenantThemes } from "./hooks/useTenantThemes";

interface ThemeManagerAppProps {
    themes?: ThemeSource[];
}

function ThemeManagerApp(props: ThemeManagerAppProps) {
    return <ThemesModule {...props} />;
}

export const ThemeManager = memo(ThemeManagerApp);
