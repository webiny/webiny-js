//@flow
import { css } from "emotion";
import styled from "react-emotion";

export const searchWrapper = css({
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    display: "flex",
    padding: 10,
    position: "relative",
    borderRadius: 2
});

export const dropdownStyle = css({
    left: 0,
    top: 47,
    position: "absolute",
    zIndex: "2",
    width: "100%",
    color: "var(--mdc-theme-on-surface)"
});

export const SearchBarInput = styled("input")({
    width: "100%",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: "var(--mdc-theme-surface)",
    "&.mdc-text-field__input": {
        paddingTop: "0 !important",
        paddingLeft: "15px !important",
        borderBottom: "none !important",
        height: "25px !important",
        color: "var(--mdc-theme-surface)",
        "&::placeholder": {
            color: "var(--mdc-theme-surface) !important"
        }
    }
});

export const SearchShortcut = styled("div")({
    border: "1px solid var(--mdc-theme-surface)",
    color: "var(--mdc-theme-surface)",
    borderRadius: 5,
    width: 20,
    height: 26,
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

export const icon = css({
    "&.mdc-button__icon": {
        width: "auto !important",
        paddingRight: 5,
        color: "var(--mdc-theme-surface)",
        opacity: 0.75
    }
});

export const iconDown = css({
    cursor: "pointer"
});

export const selectIconDown = css({
    pointerEvents: "none",
    position: "absolute",
    width: 24,
    height: 24,
    right: 19,
    top: 1,
    color: "var(--mdc-theme-surface)"
});

export const SelectWrapper = styled("div")({
    position: "relative"
});

export const selectStyles = css({
    "&.mdc-select": {
        width: "150px !important",
        height: 25,
        backgroundImage: "none !important",
        backgroundPosition: "right 8px bottom 0px",
        borderRight: "1px solid var(--mdc-theme-surface)",
        marginRight: 10,
        ".mdc-select__native-control": {
            padding: 0,
            border: "none",
            lineHeight: "120%",
            color: "var(--mdc-theme-surface) !important"
        },
        ".mdc-line-ripple": {
            display: "none"
        }
    }
});
