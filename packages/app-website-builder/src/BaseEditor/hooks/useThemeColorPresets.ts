import type { ColorPickerPreset } from "@webiny/admin-ui";
import { useWebsiteBuilderTheme } from "~/BaseEditor/components/ThemeProvider.js";

/**
 * The frontend theme's `colors`, as presets for a color picker. A picked preset stores the color's
 * `value` as given, so a theme color defined as `var(--...)` stays a reference and follows the theme.
 * Undefined, so the picker shows no presets, when the theme has no colors or the picker renders
 * outside the editor's theme provider.
 */
export const useThemeColorPresets = (): ColorPickerPreset[] | undefined => {
    let colors: ColorPickerPreset[] | undefined;
    try {
        colors = useWebsiteBuilderTheme().theme?.colors;
    } catch {
        // Outside the editor there's no theme provider; keep the plain picker.
        return undefined;
    }
    if (!colors || colors.length === 0) {
        return undefined;
    }
    return colors;
};
