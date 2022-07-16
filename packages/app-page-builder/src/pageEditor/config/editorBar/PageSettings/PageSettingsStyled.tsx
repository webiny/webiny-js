import * as React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

export const listStyle = css({
    "&.mdc-list": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-surface)"
    }
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
