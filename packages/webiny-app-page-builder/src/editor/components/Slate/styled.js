import { css } from "emotion";
import styled from "react-emotion";

export const hoverMenuStyle = css({
    display: "inline-flex",
    padding: 5,
    position: "absolute",
    borderRadius: 2,
    zIndex: 1,
    marginTop: -50,
    backgroundColor: "var(--mdc-theme-surface)",
    span: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: 2,
        svg: {
            height: 18
        }
    },
    "&::after": {
        content: "''",
        width: 0,
        height: 0,
        borderLeft: "7px solid transparent",
        borderRight: "7px solid transparent",
        borderTop: "7px solid var(--mdc-theme-surface)",
        position: "absolute",
        bottom: -7,
        left: "50%",
        transform: "translateX(-50%)"
    }
});

export const defaultStyle = {
    transform: "translateY(-20px)",
    opacity: 0,
    pointerEvents: "all",
    transitionProperty: "transform, opacity",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "100ms",
    willChange: "opacity, transform"
};

export const transitionStyles = {
    entering: { transform: "translateY(-20px)", opacity: 0 },
    entered: { transform: "translateY(0px)", opacity: 1 }
};

export const ToolbarBox = styled("div")({
    position: "absolute",
    color: "var(--mdc-theme-on-surface)",
    zIndex: 100,
    top: "calc(100% + 10px)",
    width: 350,
    ".elevationBox": {
        backgroundColor: "var(--mdc-theme-surface)",
        borderRadius: 2,
        "&::after": {
            content: "''",
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "7px solid var(--mdc-theme-surface)",
            position: "absolute",
            top: -7,
            left: "50%",
            transform: "translateX(-50%)"
        },
        ".mdc-layout-grid": {
            padding: 15,
            "&.no-bottom-padding": {
                paddingBottom: 0
            },
            ".mdc-layout-grid__inner": {
                gridGap: 0,
                '[class*="mdc-layout-grid__cell--span-"]': {
                    display: "flex",
                    alignItems: "center",
                    color: "var(--mdc-theme-text-secondary-on-background)",
                    marginBottom: 10,
                    justifyContent: "flex-end",
                    '[class*="mdc-typography--"], .mdc-button__icon': {
                        lineHeight: "120%",
                        width: "100%"
                    },
                    ".mdc-button__icon": {
                        marginRight: 20
                    },
                    "&.no-margin": {
                        margin: 0
                    }
                }
            }
        }
    }
});

export const Overlay = styled("div")({
    position: "fixed",
    zIndex: 99,
    width: "100%",
    height: "100%",
    top: 0,
    left: 0
});
