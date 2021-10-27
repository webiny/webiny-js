import styled from "@emotion/styled";
import { css } from "emotion";

export const Wrapper = styled("section")({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100vh",
    color: "var(--mdc-theme-on-surface)"
});

export const Logo = styled("img")({
    margin: "0 auto",
    marginBottom: 30,
    width: 125
});

export const LoginContent = styled("div")({
    width: "100%",
    maxWidth: 500,
    margin: "0 auto 25px auto",
    ".mdc-elevation--z2": {
        borderRadius: 4,
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.15)"
    },
    a: {
        textDecoration: "none",
        color: "var(--mdc-theme-primary)",
        fontWeight: 600,
        "&:hover": {
            textDecoration: "underline"
        }
    }
});

export const InnerContent = styled("div")({
    position: "relative",
    padding: 25
});

export const Footer = styled("div")({
    textAlign: "center",
    marginBottom: 75,
    a: {
        textDecoration: "none",
        color: "var(--mdc-theme-primary)"
    }
});

export const Title = styled("div")({
    textAlign: "center",
    margin: "10px 25px"
});

export const alignRight = css({
    textAlign: "right"
});

export const alignCenter = css({
    textAlign: "center"
});

export const errorMessage = css({
    color: "red"
});
