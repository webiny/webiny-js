import StaticLayout from "./layouts/Static";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CircularSpinner from "./components/CircularSpinner";
import { DefaultErrorPage, DefaultNotFoundPage } from "./components/defaultPages";

import {
    PbPageLayoutComponentPlugin,
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
                    types: [
                        { className: "", label: "Default" },
                        { className: "webiny-pb-element-heading-basic", label: "Basic" }
                    ]
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
                        { className: "webiny-pb-element-list-basic", label: "Basic" }
                    ]
                },
                quote: {
                    types: [
                        { className: "", label: "Default" },
                        { className: "webiny-pb-element-quote-basic", label: "Basic" }
                    ]
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
        name: "pb-layout-component-header",
        type: "pb-layout-component",
        componentType: "header",
        component: Header
    } as PbPageLayoutComponentPlugin,
    {
        name: "pb-layout-component-footer",
        type: "pb-layout-component",
        componentType: "footer",
        component: Footer
    } as PbPageLayoutComponentPlugin,
    {
        name: "pb-layout-component-loader",
        type: "pb-layout-component",
        componentType: "loader",
        component: CircularSpinner
    } as PbPageLayoutComponentPlugin,
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
