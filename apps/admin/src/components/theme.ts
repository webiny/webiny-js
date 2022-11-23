import { Theme } from "@webiny/app-page-builder-elements/types";

const colors = {
    primary: "#fa5723",
    secondary: "#00ccb0",
    background: "#eaecec",
    surface: 'purple',
    textPrimary: "#0a0a0a",
};

const fonts = {
    // default: "'IBM Plex Sans', sans-serif;"
     default: "'Lato', sans-serif;"
};

const heading = {
    fontFamily: fonts.default,
    color: colors.textPrimary,
    fontWeight: "bold",
    margin: 0,
    padding: 0
};

// Theme
export const theme: Theme = {
    breakpoints: {
        desktop: { mediaQuery: "@media (max-width: 4000px)" },
        tablet: { mediaQuery: "@media (max-width: 991px)" },
        "mobile-landscape": { mediaQuery: "@media (max-width: 767px)" },
        "mobile-portrait": { mediaQuery: "@media (max-width: 478px)" }
    },
    styles: {
        colors,
        borderRadius: 4,
        buttons: {
            default: {
                background: colors.background,
                color: colors.textPrimary
            },
            primary: {},
            secondary: {},
            outlinePrimary: {},
            outlineSecondary: {},
            simple: {}
        },

        typography: {
            paragraph: {
                fontFamily: fonts.default,
                fontSize: 16.9,
                color: colors.textPrimary,
                fontWeight: 400,
                letterSpacing: "0.45px",
                lineHeight: "1.5rem"
            },
            heading1: {
                ...heading,
                fontSize: 32
            },
            heading2: {
                ...heading,
                fontSize: 24
            },
            heading3: {
                ...heading,
                fontSize: 16
            }
        }
    }
};

// OLD
// {
//     colors: {
//         primary: "var(--webiny-theme-color-primary)",
//             secondary: "var(--webiny-theme-color-secondary)",
//             background: "var(--webiny-theme-color-background)",
//             surface: "var(--webiny-theme-color-surface)",
//             textPrimary: "var(--webiny-theme-color-text-primary)"
//     },
//     elements: {
//         button: {
//             types: [
//                 { className: "", label: "Default" },
//                 { className: "primary", label: "Primary" },
//                 { className: "secondary", label: "Secondary" },
//                 { className: "outline-primary", label: "Outline Primary" },
//                 { className: "outline-secondary", label: "Outline Secondary" },
//                 { className: "simple", label: "Simple" }
//             ]
//         },
//         heading: {
//             types: [{ className: "webiny-pb-typography-heading", label: "Default" }]
//         },
//         paragraph: {
//             types: [
//                 { className: "webiny-pb-typography-body", label: "Body" },
//                 { className: "webiny-pb-typography-description", label: "Description" }
//             ]
//         },
//         list: {
//             types: [
//                 { className: "", label: "Default" },
//                 { className: "webiny-pb-typography-list--primary", label: "Primary" },
//                 { className: "webiny-pb-typography-list--secondary", label: "Secondary" }
//             ]
//         },
//         quote: {
//             types: [{ className: "webiny-pb-typography-quote", label: "Default" }]
//         }
//     }
// }