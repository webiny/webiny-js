import { Theme } from "@webiny/app-page-builder-elements/types";
import { CSSObject } from "@emotion/react";

// Defaults first (colors, fonts, border radius, ...).
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

const borderRadius = 4;

const headings = {
    fontFamily: fonts.secondary,
    color: colors.color1.base,
    WebkitFontSmoothing: "antialiased"
};

const paragraphs = {
    fontFamily: fonts.primary,
    color: colors.color3.base,
    fontWeight: 400,
    lineHeight: "1.5rem",
    WebkitFontSmoothing: "antialiased"
};

const buttons = (overrides: CSSObject) => ({
    a: { textDecoration: "none" },
    "pb-button-body": {
        borderRadius,
        padding: "14px 20px",
        fontFamily: fonts.primary,
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        fontWeight: 600,
        justifyContent: "center",
        textAlign: "center",
        cursor: "pointer",
        transition: "all .2s",
        "&:hover": {
            boxShadow: "0 7px 14px rgb(50 50 93 / 10%), 0 3px 6px rgb(0 0 0 / 8%)",
            transform: "translateY(-1px)"
        },
        ...overrides
    }
});

// Theme object.
export const theme: Theme = {
    breakpoints: {
        desktop: { mediaQuery: "@media (max-width: 4000px)" },
        tablet: { mediaQuery: "@media (max-width: 991px)" },
        "mobile-landscape": { mediaQuery: "@media (max-width: 767px)" },
        "mobile-portrait": { mediaQuery: "@media (max-width: 478px)" }
    },
    styles: {
        colors,
        typography: {
            paragraph1: {
                ...paragraphs,
                fontSize: 17
            },
            paragraph2: {
                ...paragraphs,
                fontSize: 12.5,
                letterSpacing: "0.45px",
                lineHeight: "19px"
            },

            heading1: { ...headings, fontWeight: "bold", fontSize: 48 },
            heading2: { ...headings, fontSize: 36 },
            heading3: { ...headings, fontSize: 30 },
            heading4: { ...headings, fontSize: 24 },
            heading5: { ...headings, fontSize: 20 },
            heading6: { ...headings, fontSize: 18, lineHeight: "1.75rem" },
            quote: { ...paragraphs }
        },
        quote: {
            color: colors.color3.base,
            fontFamily: fonts.primary,
            fontWeight: "bold",
            fontSize: 22,
            "blockquote > q": {
                quotes: "auto",
                "&:before": { content: "open-quote" },
                "&:after": { content: "close-quote" }
            }
        },
        button: {
            default: buttons({ background: colors.color4.base, color: colors.color3.base }),
            primary: buttons({ background: colors.color1.base, color: colors.color5.base }),
            secondary: buttons({ background: colors.color2.base, color: colors.color5.base }),
            outlinePrimary: buttons({ border: `2px solid ${colors.color1.base}` }),
            outlineSecondary: buttons({ border: `2px solid ${colors.color2.base}` }),
            simple: buttons({ "&:hover": { transform: "translateY(-1px)" } })
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
        grid: { "mobile-landscape": { flexWrap: "wrap" } },
        cell: { tablet: { width: "100%" } }
    }
};
