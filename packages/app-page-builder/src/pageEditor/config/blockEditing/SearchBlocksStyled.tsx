import * as React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

export const listStyle = css({
    "&.mdc-deprecated-list": {
        height: "100%",
        padding: 0,
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

export const listItem = css({
    padding: "15px 20px !important",
    cursor: "pointer",
    overflow: "visible !important",
    borderBottom: "1px solid var(--mdc-theme-background)",
    height: "auto !important",
    transition: "background 0.3s",
    "&::before": {
        display: "none"
    },
    "&::after": {
        display: "none"
    },
    "&:last-child": {
        borderBottom: "none"
    },
    ".mdc-deprecated-list-item__graphic": {
        marginRight: 20
    }
});

export const activeListItem = css({
    background: "var(--mdc-theme-background) !important"
});

export const IconWrapper = styled("div")({
    marginRight: 15
});

export const ListItemTitle = styled("div")({
    fontWeight: 600,
    marginBottom: 5
});

export const Title = (
    <Typography
        style={{ margin: "0 auto", color: "var(--mdc-theme-on-surface)" }}
        use={"headline6"}
    >
        Page Settings
    </Typography>
);

export const TitleContent = styled("div")({
    display: "flex",
    flexDirection: "column"
});
