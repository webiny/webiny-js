import StaticLayout from "./layouts/Static";
import { DefaultErrorPage, DefaultNotFoundPage } from "./components/defaultPages";

import {
    PbPageLayoutPlugin,
    PbThemePlugin,
    PbDefaultPagePlugin
} from "@webiny/app-page-builder/types";

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
            },
            typography: {
                h1: {
                    label: "Heading 1",
                    component: "h1",
                    className: "webiny-pb-typography-h1"
                },
                h2: {
                    label: "Heading 2",
                    component: "h2",
                    className: "webiny-pb-typography-h2"
                },
                h3: {
                    label: "Heading 3",
                    component: "h3",
                    className: "webiny-pb-typography-h3"
                },
                h4: {
                    label: "Heading 4",
                    component: "h4",
                    className: "webiny-pb-typography-h4"
                },
                h5: {
                    label: "Heading 5",
                    component: "h5",
                    className: "webiny-pb-typography-h5"
                },
                h6: {
                    label: "Heading 6",
                    component: "h6",
                    className: "webiny-pb-typography-h6"
                },
                paragraph: {
                    label: "Paragraph",
                    component: "p",
                    className: "webiny-pb-typography-body"
                },
                description: {
                    label: "Description",
                    component: "p",
                    className: "webiny-pb-typography-description"
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
    } as PbPageLayoutPlugin,
    {
        name: "pb-default-page-error",
        type: "pb-default-page",
        component: DefaultErrorPage
    } as PbDefaultPagePlugin,
    {
        name: "pb-default-page-not-found",
        type: "pb-default-page",
        component: DefaultNotFoundPage
    } as PbDefaultPagePlugin
];
