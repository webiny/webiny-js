import styled from "@emotion/styled";
import { css } from "emotion";

export const MenuHeader = styled("div")({
    display: "flex",
    alignItems: "center",
    padding: 5,
    backgroundColor: "var(--mdc-theme-surface)",
    borderBottom: "1px solid var(--mdc-theme-on-background)"
});

export const navHeader = css({
    padding: 0,
    "&.mdc-drawer__header": {
        padding: "0 !important",
        minHeight: 0
    }
});

export const navContent = css({
    padding: "0 !important"
});

export const logoStyle = css({
    "&.mdc-top-app-bar__title": {
        paddingLeft: 15,
        ".webiny-logo": {
            color: "var(--mdc-theme-primary)"
        }
    }
});

export const menuTitle = css({
    ".mdc-drawer &.mdc-list": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        padding: 0,
        ".mdc-list-item": {
            margin: 0,
            padding: "0 15px",
            height: "auto",
            width: "100%",
            fontWeight: "600",
            boxSizing: "border-box"
        },
        '>a[data-expanded="true"]': {
            ".mdc-list-item": {
                backgroundColor: "var(--mdc-theme-background)"
            }
        }
    }
});

export const linkStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    textDecoration: "none",
    fontWeight: "600"
});

export const submenuItems = css({
    ".mdc-drawer &.mdc-list-item": {
        paddingLeft: 65
    }
});

export const submenuList = css({
    "&.mdc-list": {
        padding: 0
    }
});

export const menuSubtitle = css({
    marginLeft: 20,
    display: "block",
    color: "var(--mdc-theme-on-surface)"
});

export const MenuFooter = styled("div")({
    borderTop: "1px solid var(--mdc-theme-on-background)",
    a: {
        color: "var(--mdc-theme-text-on-primary)",
        textDecoration: "none"
    }
});

export const subFooter = css({
    ".mdc-drawer &.mdc-list-item": {
        borderTop: "1px solid var(--mdc-theme-on-background)",
        padding: "10px 8px"
    }
});