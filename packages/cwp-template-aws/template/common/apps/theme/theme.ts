import { createTheme } from "@webiny/app-theme";
import { CSSObject } from "@emotion/core";

// Breakpoints (desktop, tablet, mobile).
export const breakpoints = {
    desktop: "@media (max-width: 4000px)",
    tablet: "@media (max-width: 991px)",
    "mobile-landscape": "@media (max-width: 767px)",
    "mobile-portrait": "@media (max-width: 478px)"
};

// Colors.
export const colors = {
    color1: "#fa5723", // primary
    color2: "#00ccb0", // secondary
    color3: "#0a0a0a", // text primary
    color5: "#eaecec", // background
    color6: "#ffffff", // white background
    color4: "#616161" // text secondary
};

// Fonts.
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
    WebkitFontSmoothing: "antialiased"
};

const paragraphs = {
    fontFamily: fonts.font1,
    color: colors.color3,
    fontWeight: 400,
    lineHeight: "1.5rem",
    WebkitFontSmoothing: "antialiased"
};

export const typography = {
    heading1: { ...headings, fontWeight: "bold", fontSize: 48 },
    heading2: { ...headings, fontSize: 36 },
    heading3: { ...headings, fontSize: 30 },
    heading4: { ...headings, fontSize: 24 },
    heading5: { ...headings, fontSize: 20 },
    heading6: { ...headings, fontSize: 18, lineHeight: "1.75rem" },
    paragraph1: { ...paragraphs, fontSize: 16.5 },
    paragraph2: {
        ...paragraphs,
        fontSize: 12.5,
        letterSpacing: "0.45px",
        lineHeight: "19px"
    },
    quote: {
        ...paragraphs,
        fontWeight: "bold",
        fontSize: 22
    },
    list: { ...paragraphs, fontSize: 17 }
} as const; // https://github.com/emotion-js/emotion/issues/1373#issuecomment-498059774

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
            quote: {
                "blockquote > q": {
                    quotes: "auto",
                    "&:before": { content: "open-quote" },
                    "&:after": { content: "close-quote" }
                }
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
            },

            list: {
                "ul, ol": {
                    li: {
                        marginBottom: "12px",
                        marginLeft: "1.875rem",
                        position: "relative"
                    }
                },
                ul: {
                    li: {
                        "&:before,&:after": {
                            position: "absolute",
                            content: '""',
                            borderRadius: "50%"
                        },
                        "&:before": {
                            backgroundColor: "#90c418",
                            height: "1.25rem",
                            width: "1.25rem",
                            left: "-1.875rem",
                            top: "0.125rem"
                        },
                        "&:after": {
                            backgroundColor: "#ffffff",
                            height: "0.5rem",
                            left: "-1.5rem",
                            top: "0.5rem",
                            width: "0.5rem"
                        }
                    }
                },
                ol: {
                    listStyleType: "decimal"
                }
            }
        }
    }
});

export default theme;
