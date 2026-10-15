import React, { useEffect } from "react";
import type { Preview } from "@storybook/react";
import { AdminUiProvider } from "../src/AdminUiProvider/AdminUiProvider.js";
import { darkThemeBase } from "../src/themes/darkThemeBase.js";

import "../src/theme.css";

/**
 * Themes are applied as runtime CSS variables (the real admin does this from registered theme
 * files). Storybook can't import the project's theme files, so it previews "Webiny Dark" by
 * applying the shared `darkThemeBase` mapping over the default ramp.
 */
const applyTheme = (variables: Record<string, string>) => {
    const root = document.documentElement;
    Object.keys(darkThemeBase).forEach(key => root.style.removeProperty(key));
    Object.entries(variables).forEach(([key, value]) => root.style.setProperty(key, value));
};

const ThemeApplier = ({ theme }: { theme: string }) => {
    useEffect(() => {
        applyTheme(theme === "dark" ? darkThemeBase : {});
    }, [theme]);
    return null;
};

const preview: Preview = {
    parameters: {
        layout: "centered",
        docs: { toc: { headingSelector: "h2, h3, h4" } }
    },
    globalTypes: {
        theme: {
            description: "Admin UI appearance",
            defaultValue: "light",
            toolbar: {
                title: "Theme",
                icon: "contrast",
                items: [
                    { value: "light", title: "Light", icon: "sun" },
                    { value: "dark", title: "Webiny Dark", icon: "moon" }
                ],
                dynamicTitle: true
            }
        }
    },
    decorators: [
        (Story, context) => (
            <AdminUiProvider>
                <ThemeApplier theme={context.globals.theme} />
                <Story />
            </AdminUiProvider>
        )
    ]
};

export default preview;
