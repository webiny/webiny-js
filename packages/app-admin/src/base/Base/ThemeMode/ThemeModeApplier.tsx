import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { useFeature } from "@webiny/app";
import { ThemeFeature } from "~/features/theme/feature.js";
import { useTheme } from "./useTheme.js";
import { useBrandVariables } from "./useBrandVariables.js";

/**
 * Writes the active theme's variables, with the brand colors from `<AdminConfig.Theme.Color />`
 * on top, to `<html>` before paint. Brand colors go last: they are project configuration and
 * outrank a theme's default accent. Renders nothing.
 */
export const ThemeModeApplier = () => {
    const { theme, themes, variables } = useTheme();
    const brandVariables = useBrandVariables();
    const { selection, writer } = useFeature(ThemeFeature);

    useLayoutEffect(() => {
        writer.write({ ...variables, ...brandVariables });
    }, [writer, variables, brandVariables]);

    /*
     * The stored variables are a copy taken at selection time. Once the extension has registered
     * the selected theme, store its current variables, so a token added in a later release
     * reaches the first paint after the next reload.
     */
    const registered = themes.find(t => t.id === theme);

    useEffect(() => {
        if (registered) {
            selection.select(registered);
        }
    }, [selection, registered]);

    return null;
};
