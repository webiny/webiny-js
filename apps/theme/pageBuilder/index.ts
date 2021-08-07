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
                textPrimary: "var(--webiny-theme-color-text-primary)",
                purple: "var(--webiny-theme-color-purple)",
                yellow: "var(--webiny-theme-color-yellow)",
                darkGray: "var(--webiny-theme-color-dark-gray)"
            },
            elements: {
                button: {
                    types: [
                        { className: "", label: "Default" },
                        { className: "primary", label: "Primary" },
                        { className: "secondary", label: "Secondary" },
                        { className: "outline-primary", label: "Outline Primary" },
                        { className: "outline-secondary", label: "Outline Secondary" },
                        { className: "purple", label: "Purple" },
                        { className: "yellow", label: "Yellow" },
                        { className: "dark", label: "Dark" },
                        { className: "simple", label: "Simple" }
                    ]
                },
                heading: {
                    types: [
                        { className: "webiny-pb-typography-heading", label: "Default" },
                        { className: "webiny-pb-typography-heading--1", label: "Heading 1" },
                        { className: "webiny-pb-typography-heading--2", label: "Heading 2" },
                        { className: "webiny-pb-typography-heading--3", label: "Heading 3" },
                        { className: "webiny-pb-typography-heading--4", label: "Heading 4" },
                        { className: "webiny-pb-typography-heading--5", label: "Heading 5" },
                        { className: "webiny-pb-typography-heading--6", label: "Heading 6" }
                    ]
                },
                paragraph: {
                    types: [
                        { className: "webiny-pb-typography-body", label: "Body" },
                        { className: "webiny-pb-typography-body-xl", label: "Body xl" },
                        { className: "webiny-pb-typography-description", label: "Description" },
                        { className: "webiny-pb-typography-title", label: "Title" },
                        { className: "webiny-pb-typography-subtitle", label: "Subtitle" }
                    ]
                },
                list: {
                    types: [
                        { className: "", label: "Default" },
                        { className: "webiny-pb-typography-list--primary", label: "Primary" },
                        { className: "webiny-pb-typography-list--secondary", label: "Secondary" },
                        { className: "webiny-pb-typography-list--checkbox", label: "Checkbox" },
                        {
                            className: "webiny-pb-typography-list--big-numbers",
                            label: "Big Numbers"
                        }
                    ]
                },
                quote: {
                    types: [
                        { className: "webiny-pb-typography-quote", label: "Default" },
                        { className: "webiny-pb-typography-quote--big-purple", label: "Big Purple" }
                    ]
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
