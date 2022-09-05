import styled from "@emotion/styled";
import { css } from "emotion";

export const Wrapper = styled("section")({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100vh",
    color: "var(--mdc-theme-on-surface)",
    ".spinner__inner-wrapper": {
        whiteSpace: "nowrap"
    },
    ul: {
        listStyle: "disc",
        paddingLeft: "var(--mdc-layout-grid-margin-desktop, 24px)",
        li: {
            color: "var(--desktop-color, var(--webiny-theme-color-text-primary, rgb(10, 10, 10)))",
            MozOsxFontSmoothing: "grayscale",
            WebkitFontSmoothing: "antialiased",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            fontWeight: 400,
            letterSpacing: "0.03125em",
            textDecoration: "inherit",
            textTransform: "inherit",
            marginTop: "20px",
            marginBottom: "20px"
        }
    }
});

export const InstallContent = styled("div")({
    maxWidth: 800,
    margin: "0 auto 25px auto",
    ".mdc-elevation--z2": {
        borderRadius: 4,
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.15)"
    }
});

export const installerSplitView = css({
    // height: "100vh",
    ".webiny-split-view__inner": {
        height: "100vh"
    },
    ".webiny-split-view__right-panel-wrapper": {
        height: "100vh"
    }
});

export const SuccessDialog = styled("div")({
    padding: 40,
    textAlign: "center",
    p: {
        paddingBottom: 40
    }
});

export const InnerContent = styled("div")({
    padding: 25,
    position: "relative"
});

export const alertClass = css({
    borderLeft: "3px solid red",
    margin: "5px 0 15px 0",
    padding: "2px 0 2px 10px"
});
