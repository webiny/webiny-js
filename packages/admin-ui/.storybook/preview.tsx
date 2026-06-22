import React, { useEffect } from "react";
import type { Preview } from "@storybook/react";
import { AdminUiProvider } from "../src/AdminUiProvider/AdminUiProvider.js";

import "../src/theme.css";

const ThemeMode = ({ theme }: { theme: string }) => {
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
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
                    { value: "webiny-dark", title: "Webiny Dark", icon: "moon" },
                    { value: "dracula", title: "Dracula", icon: "moon" },
                    { value: "github-dark", title: "GitHub Dark", icon: "moon" },
                    { value: "one-dark-pro", title: "One Dark Pro", icon: "moon" },
                    { value: "tokyo-night", title: "Tokyo Night", icon: "moon" },
                    { value: "catppuccin-mocha", title: "Catppuccin Mocha", icon: "moon" }
                ],
                dynamicTitle: true
            }
        }
    },
    decorators: [
        (Story, context) => (
            <AdminUiProvider>
                <ThemeMode theme={context.globals.theme} />
                <Story />
            </AdminUiProvider>
        )
    ]
};

export default preview;
