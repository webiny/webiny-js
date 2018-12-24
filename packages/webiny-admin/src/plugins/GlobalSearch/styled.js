//@flow
import { css } from "emotion";
import styled from "react-emotion";

export const SearchShortcut = styled("div")({
    border: "1px solid var(--mdc-theme-surface)",
    color: "var(--mdc-theme-surface)",
    borderRadius: 5,
    width: 20,
    height: 24,
    marginTop: 1,
    textAlign: "center",
    fontSize: "12px",
    paddingTop: "3px",
    boxSizing: "border-box",
    cursor: "default",
    opacity: "0.8"
});

export const SearchBarWrapper = styled("div")({
    display: "flex",
    width: "100%"
});

export const SearchBarInputWrapper = styled("div")({
    display: "flex",
    width: "100%",
    position: "relative"
});

export const searchBarInput = css({
    width: "100%",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    "&.mdc-text-field__input": {
        paddingTop: "5px !important",
        paddingLeft: "10px !important",
        borderBottom: "none !important",
        height: "25px !important",
        color: "var(--mdc-theme-surface)",
        "&::placeholder": {
            color: "var(--mdc-theme-surface) !important"
        },
        "&:focus::placeholder": {
            color: "var(--mdc-theme-text-secondary-on-background) !important"
        }
    }
});

export const searchBarDropdown = css({
    position: "absolute",
    background: "white",
    left: -1,
    width: "calc(100% + 2px)",
    top: 45,
    zIndex: "2",
    color: "var(--mdc-theme-on-surface)",
    borderRadius: "0 0 5px 5px",
    ".mdc-list": {
        padding: 0,
        ".mdc-list-item": {
            "&.selected": {
                fontWeight: "bold"
            },
            "&.highlighted": {
                backgroundColor: "var(--mdc-theme-on-background)"
            }
        }
    }
});

export const icon = css({
    "&.mdc-button__icon": {
        width: "auto !important",
        paddingRight: 5,
        opacity: 0.75,
        marginTop: 2
    }
});

export const iconSearchType = css({
    cursor: "pointer",
    paddingLeft: 5
});

export const searchWrapper = css({
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    display: "flex",
    padding: "10px 20px",
    position: "relative",
    borderRadius: 4,
    transition: "background 100ms ease-in,width 100ms ease-out",
    color: "var(--mdc-theme-surface)",
    border: "1px solid transparent",
    "&.active": {
        color: "var(--mdc-theme-on-surface)",
        border: "1px solid var(--mdc-theme-text-hint-on-dark)",
        background: "var(--mdc-theme-surface)",
        boxShadow: "0 1px 1px var(--mdc-theme-text-hint-on-dark)",
        input: {
            color: "var(--mdc-theme-on-surface)"
        },
        [SearchShortcut]: {
            display: "none"
        }
    },
    input: {
        color: "var(--mdc-theme-surface)"
    }
});
