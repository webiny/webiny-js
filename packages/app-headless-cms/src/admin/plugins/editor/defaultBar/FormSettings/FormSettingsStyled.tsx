import * as React from "react";
import { css } from "@emotion/css";
import styled from "@emotion/styled";
import { Heading } from "@webiny/admin-ui";

export const listStyle = css({
    "&.mdc-deprecated-list": {
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
    ".mdc-deprecated-list-item__graphic": {
        marginRight: 20
    }
});

export const ListItemTitle = styled("div")({
    fontWeight: 600,
    marginBottom: 5
});

export const Title = (
    <Heading level={6} style={{ margin: "0 auto", color: "var(--mdc-theme-on-surface)" }}>
        Content model settings
    </Heading>
);

export const TitleContent = styled("div")({
    display: "flex",
    flexDirection: "column"
});
