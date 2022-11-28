import { Theme } from "@webiny/app-page-builder-elements/types";

const colors = {
    color1: { base: "#fa5723" }, // primary
    color2: { base: "#00ccb0" }, // secondary
    color3: { base: "#0a0a0a" }, // text primary
    color4: { base: "#eaecec" }, // background
    color5: { base: "#ffffff" } // white background
};

const fonts = {
    primary: "'IBM Plex Sans', sans-serif;",
    secondary: "'Lato', sans-serif;"
};

const defaults = {
    headings: {
        fontFamily: fonts.secondary,
        color: colors.color1.base,
        WebkitFontSmoothing: "antialiased"
    },
    paragraphs: {
        fontFamily: fonts.primary,
        color: colors.color1.base,
        fontWeight: 400,
        lineHeight: "1.5rem",
        WebkitFontSmoothing: "antialiased"
    }
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
        button: {
            default: {
                background: colors.color3.base,
                color: colors.color1.base
            },
            primary: {},
            secondary: {},
            outlinePrimary: {},
            outlineSecondary: {},
            simple: {}
        },
        list: {
            li: {
                marginBottom: "12px",
                marginLeft: "1.875rem",
                position: "relative",
                "&:before": {
                    backgroundColor: "#90c418",
                    borderRadius: "50%",
                    content: '""',
                    height: "1.25rem",
                    width: "1.25rem",
                    left: "-1.875rem",
                    position: "absolute",
                    top: "0.125rem"
                },
                "&:after": {
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                    content: '""',
                    height: "0.5rem",
                    left: "-1.5rem",
                    position: "absolute",
                    top: "0.5rem",
                    width: "0.5rem"
                }
            }
        },
        grid: {
            "mobile-landscape": { flexWrap: "wrap" }
        },
        typography: {
            paragraph1: {
                ...defaults.paragraphs,
                fontSize: 17
            },
            paragraph2: {
                ...defaults.paragraphs,
                fontSize: 12.5,
                letterSpacing: "0.45px",
                lineHeight: "19px"
            },

            heading1: { ...defaults.headings, fontWeight: "bold", fontSize: 48 },
            heading2: { ...defaults.headings, fontSize: 36 },
            heading3: { ...defaults.headings, fontSize: 30 },
            heading4: { ...defaults.headings, fontSize: 24 },
            heading5: { ...defaults.headings, fontSize: 20 },
            heading6: { ...defaults.headings, fontSize: 18, lineHeight: "1.75rem" }
        }
    }
};
