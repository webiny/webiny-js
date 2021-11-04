import StaticLayout from "./layouts/Static";

import { PbPageLayoutPlugin, PbThemePlugin } from "@webiny/app-page-builder/types";

export default [
    {
        type: "pb-theme",
        theme: {
            colors: {
                primary: "var(--webiny-theme-color-primary)",
                secondary: "var(--webiny-theme-color-secondary)",
                background: "var(--webiny-theme-color-background)",
                surface: "var(--webiny-theme-color-surface)",
                textPrimary: "var(--webiny-theme-color-text-primary)"
            },
            elements: {
                button: {
                    types: [
                        { className: "", label: "Default" },
                        { className: "primary", label: "Primary" },
                        { className: "secondary", label: "Secondary" },
                        { className: "outline-primary", label: "Outline Primary" },
                        { className: "outline-secondary", label: "Outline Secondary" },
                        { className: "simple", label: "Simple" }
                    ]
                },
                heading: {
                    types: [{ className: "webiny-pb-typography-heading", label: "Default" }]
                },
                paragraph: {
                    types: [
                        { className: "webiny-pb-typography-body", label: "Body" },
                        { className: "webiny-pb-typography-description", label: "Description" }
                    ]
                },
                list: {
                    types: [
                        { className: "", label: "Default" },
                        { className: "webiny-pb-typography-list--primary", label: "Primary" },
                        { className: "webiny-pb-typography-list--secondary", label: "Secondary" }
                    ]
                },
                quote: {
                    types: [{ className: "webiny-pb-typography-quote", label: "Default" }]
                }
            }
        }
    } as PbThemePlugin,
    {
        name: "pb-page-layout-static",
        type: "pb-page-layout",
        layout: {
            name: "static",
            title: "Static page",
            component: StaticLayout
        }
    } as PbPageLayoutPlugin
];
