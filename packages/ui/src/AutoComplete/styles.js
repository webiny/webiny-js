// @flow
import { css } from "emotion";

export const autoCompleteStyle = css({
    position: "relative",
    ".mdc-elevation--z1": {
        position: "absolute",
        width: "calc(100% - 2px)",
        left: 1,
        top: 56,
        zIndex: 10,
        maxHeight: 200,
        overflowY: "scroll",
        backgroundColor: "var(--mdc-theme-surface)"
    },
    ul: {
        listStyle: "none",
        width: "100%",
        padding: 0,
        li: {
            padding: 10
        }
    }
});

export const suggestionList = css({
    fontWeight: "normal",
    backgroundColor: "var(--mdc-theme-surface)",
    transition: "background-color 0.2s",
    color: "var(--mdc-theme-text-primary-on-background)",
    "&.selected": {
        fontWeight: "bold"
    },
    "&.highlighted": {
        backgroundColor: "var(--mdc-theme-on-background)"
    }
});
