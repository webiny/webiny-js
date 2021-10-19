import { Theme } from "@webiny/app-page-builder-elements/types";

const colors = {
    text: "#231010",
    primary: "#fa5723",
    secondary: "purple",
    tertiary: "cyan"
};

const fonts = {
    default: "'Trebuchet MS', sans-serif;"
};

const heading = {
    fontFamily: fonts.default,
    color: colors.text,
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
        typography: {
            paragraph: {
                fontFamily: fonts.default,
                fontSize: 14,
                color: colors.text
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
