import { createTheme } from "@webiny/app-theme";
import { CSSObject } from "@emotion/react";

// Breakpoints (desktop, tablet, mobile).
export const breakpoints = {
    desktop: "@media (max-width: 4000px)",
    tablet: "@media (max-width: 991px)",
    "mobile-landscape": "@media (max-width: 767px)",
    "mobile-portrait": "@media (max-width: 478px)"
};

// Colors.
export const colors = {
    color1: "#fa5723", // Primary.
    color2: "#00ccb0", // Secondary.
    color3: "#0a0a0a", // Text primary.
    color4: "#616161", // Text secondary.
    color5: "#eaecec", // Background.
    color6: "#ffffff" // White background.
};

// Fonts (imported in global.scss).
export const fonts = {
    font1: "'IBM Plex Sans', sans-serif;", // Primary.
    font2: "'Lato', sans-serif;" // Secondary.
};

// Border radius.
export const borderRadius = 4;

// Typography.
const headings = {
    fontFamily: fonts.font2,
    color: colors.color3,
    WebkitFontSmoothing: "antialiased",
    lineHeight: "150%"
};

const paragraphs = {
    fontFamily: fonts.font1,
    color: colors.color3,
    fontWeight: 400,
    lineHeight: 1.35,
    WebkitFontSmoothing: "antialiased"
};

export const typography = {
    headings: [
        {
            id: "heading1",
            name: "Heading 1",
            tag: "h1",
            styles: { ...headings, fontWeight: "bold", fontSize: 48 }
        },
        {
            id: "heading2",
            name: "Heading 2",
            tag: "h2",
            styles: { ...headings, fontSize: 36 }
        },
        {
            id: "heading3",
            name: "Heading 3",
            tag: "h3",
            styles: { ...headings, fontSize: 30 }
        },
        {
            id: "heading4",
            name: "Heading 4",
            tag: "h4",
            styles: { ...headings, fontSize: 24 }
        },
        {
            id: "heading5",
            name: "Heading 5",
            tag: "h5",
            styles: { ...headings, fontSize: 20 }
        },
        {
            id: "heading6",
            name: "Heading 6",
            tag: "h6",
            styles: { ...headings, fontSize: 18, lineHeight: "1.75rem" }
        }
    ],
    paragraphs: [
        {
            id: "paragraph1",
            name: "Paragraph 1",
            tag: "p",
            styles: { ...paragraphs, fontSize: 16.5 }
        },
        {
            id: "paragraph2",
            name: "Paragraph 2",
            tag: "p",
            styles: {
                ...paragraphs,
                fontSize: 12.5,
                letterSpacing: "0.45px",
                lineHeight: "19px"
            }
        }
    ],
    quotes: [
        {
            id: "quote",
            name: "Quote",
            tag: "quoteblock",
            styles: {
                ...paragraphs,
                fontWeight: "bold",
                fontSize: 22
            }
        }
    ],
    lists: [{ id: "list", name: "List 1", tag: "ul", styles: { ...paragraphs, fontSize: 17 } }]
};

// Buttons.
const buttons = (overrides: CSSObject) => ({
    a: { textDecoration: "none" },
    ".button-body": {
        borderRadius,
        border: 0,
        padding: "14px 20px",
        fontFamily: fonts.font1,
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
const theme = createTheme({
    breakpoints,
    styles: {
        colors,
        typography,
        elements: {
            document: {
                a: { color: colors.color1 },
                b: { fontWeight: "bold" },
                i: { fontStyle: "italic" }
            },
            button: {
                default: buttons({ background: colors.color5, color: colors.color3 }),
                primary: buttons({ background: colors.color1, color: colors.color6 }),
                secondary: buttons({ background: colors.color2, color: colors.color6 }),
                outlinePrimary: buttons({
                    border: `2px solid ${colors.color1}`,
                    color: colors.color1
                }),
                outlineSecondary: buttons({
                    border: `2px solid ${colors.color2}`,
                    color: colors.color2
                }),
                simple: buttons({
                    color: colors.color1,
                    "&:hover": { transform: "translateY(-1px)" }
                })
            }
        }
    }
});

export default theme;
