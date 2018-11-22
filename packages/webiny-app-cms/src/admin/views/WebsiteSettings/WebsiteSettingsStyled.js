// @flow
import { css } from "emotion";
import styled from "react-emotion";

export const listStyle = css({
    "&.mdc-list": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

export const listItem = css({
    padding: "15px 20px",
    cursor: "pointer",
    borderBottom: "1px solid var(--mdc-theme-background)",
    "&:last-child": {
        borderBottom: "none"
    },
    ".mdc-list-item__graphic": {
        marginRight: 20
    }
});

export const ListItemTitle = styled("div")({
    fontWeight: 600,
    marginBottom: 5
});

export const TitleContent = styled("div")({
    display: "flex",
    flexDirection: "column"
});
