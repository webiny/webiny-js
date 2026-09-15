import { useMemo } from "react";
import { useAdminConfig } from "~/config/AdminConfig.js";
import { resolveBrandVariables } from "~/config/AdminConfig/Theme/resolveBrandVariables.js";

/**
 * The CSS variables for the brand colors registered via `<AdminConfig.Theme.Color />`. Layered
 * on top of the active theme's variables by every caller of `applyTheme`, so project branding
 * outranks a theme's default accent and is never cleared by a theme switch.
 */
export const useBrandVariables = (): Record<string, string> => {
    const { brandColors } = useAdminConfig();

    return useMemo(() => resolveBrandVariables(brandColors), [brandColors]);
};
