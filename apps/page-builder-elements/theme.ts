const colors = {
    primary: "#fa5723",
    onPrimary: "#ffffff"
};

const typography = {
    primary: { fontFamily: "'Trebuchet MS', sans-serif;", fontSize: 14 }
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
        typography,
        // Buttons.
        buttons: {
            primary: {
                desktop: {
                    a: {
                        ...typography.primary,
                        backgroundColor: colors.primary,
                        color: colors.onPrimary,
                        display: "flex",
                        alignItems: "center !important",
                        justifyContent: "center",
                        padding: "14px 20px !important",
                        verticalAlign: "top",
                        textAlign: "center",
                        lineHeight: 1,
                        borderRadius: "4px",
                        willChange: "opacity",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        textDecoration: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                        fontWeight: 600,
                        boxSizing: "border-box",
                        outline: "none",
                        border: "none",
                        minWidth: "100px",
                        width: "auto"
                    }
                }
            }
        }
    }
};
