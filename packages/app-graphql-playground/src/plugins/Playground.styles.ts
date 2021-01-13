import styled from "@emotion/styled";

const sharedStyles = {
    "p, a, h1, h2, h3, h4, ul, pre, code": {
        margin: 0,
        padding: 0,
        color: "inherit"
    },
    "a:active, a:focus, button:focus, input:focus": {
        outline: "none"
    },
    "input, button, submit": {
        border: "none"
    },
    "input, button, pre": {
        fontFamily: "'Open Sans', sans-serif"
    },
    code: {
        fontFamily: "Consolas, monospace"
    }
};

export const PlaygroundContainer = styled("div")({
    marginTop: -3,
    overflow: "hidden",
    ".playground": {
        height: "calc(100vh - 64px)",
        margin: 0,
        padding: 0,
        fontFamily: "'Open Sans', sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        color: "rgba(0,0,0,.8)",
        lineHeight: 1.5,
        letterSpacing: 0.53,
        marginRight: "-1px !important",
        ...sharedStyles
    }
});

export const playgroundDialog = {
    ".ReactModalPortal": sharedStyles
};
