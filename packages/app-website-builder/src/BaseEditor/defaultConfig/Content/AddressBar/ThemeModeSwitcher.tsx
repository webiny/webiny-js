import React, { useEffect } from "react";
import { Text, ToggleGroupPrimitive } from "@webiny/admin-ui";
import { useActiveTheme } from "@webiny/app-theme";
import { ReactComponent as LightModeIcon } from "@webiny/icons/light_mode.svg";
import { ReactComponent as DarkModeIcon } from "@webiny/icons/dark_mode.svg";
import { useThemeMode, type ThemeMode } from "~/BaseEditor/hooks/useThemeMode.js";

/** The mode the theme renders in by default — the same choice the CSS artifact's media query encodes. */
const resolveDefaultMode = (defaultMode: string | undefined): ThemeMode => {
    if (defaultMode === "dark") {
        return "dark";
    }
    if (defaultMode === "light") {
        return "light";
    }
    // "system": follow the OS preference, matching what the iframe would show unforced.
    return typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
};

/**
 * Previews the page in light or dark mode. Only shown when the active theme actually ships a dark
 * palette — a single-scheme (light-only) theme has no dark values, so the toggle would do nothing.
 */
export const ThemeModeSwitcher = () => {
    const { loaded, snapshot, policy } = useActiveTheme();
    const { themeMode, isSet, setThemeMode } = useThemeMode();

    // Only meaningful when a Theme-module theme is actually active and ships a dark palette. With no
    // theme (`snapshot` null) the canvas is styled by the project's own CSS (Tailwind, baked tokens…),
    // which our `data-wby-theme-mode` attribute doesn't drive — so the toggle would be dead.
    const showsToggle = snapshot !== null && policy.colorScheme !== "single";

    // Sync the initial state to what the iframe actually shows: with no forced attribute it follows
    // the theme's default mode (light/dark, or the OS under "system"). Force that same mode so the
    // control and the canvas agree from the first render, instead of defaulting the control to light.
    useEffect(() => {
        if (loaded && showsToggle && !isSet) {
            setThemeMode(resolveDefaultMode(policy.defaultMode));
        }
    }, [loaded, showsToggle, isSet, policy.defaultMode, setThemeMode]);

    if (!showsToggle) {
        return null;
    }

    return (
        <ToggleGroupPrimitive
            size={"md"}
            value={themeMode}
            onChange={value => setThemeMode(value as ThemeMode)}
            variant={"ghost"}
            bordered={false}
            items={[
                {
                    value: "light",
                    icon: <LightModeIcon className={"size-md"} />,
                    tooltip: <Text size="md">Light mode</Text>
                },
                {
                    value: "dark",
                    icon: <DarkModeIcon className={"size-md"} />,
                    tooltip: <Text size="md">Dark mode</Text>
                }
            ]}
        />
    );
};
