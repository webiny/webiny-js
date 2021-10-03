const fonts = {
    default: "'Trebuchet MS', sans-serif;"
}

const colors = {
    text: "#231010",
    primary: "#fa5723"
};

const typography = {
    primary: { fontFamily: fonts.default, fontSize: 14, color: colors.text },
    paragraph: {
    },
    heading: {
        h: {
            fontFamily: fonts.default,
            fontWeight: "bold",
            color: colors.text,
            margin: 0,
            padding: 0
        },
        h1: {
            fontSize: 32
        },
        h2: {
            fontSize: 24
        },
        h3: {
            fontSize: 16
        }
    }
};

// Theme
export const theme = {
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

            }
        }
    }
};
