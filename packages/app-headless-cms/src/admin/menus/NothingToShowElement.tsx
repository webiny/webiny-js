// TODO: implement this without relying on the `ui` package
import React from "react";
import { css } from "emotion";
import { List, ListItem } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";

const linkStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "100%",
    outline: "none",
    paddingLeft: 72,
    "&:hover": {
        textDecoration: "none"
    }
});

const submenuItems = css({
    ".mdc-drawer &.mdc-deprecated-list-item": {
        margin: 0,
        paddingLeft: 0
    }
});

const submenuList = css({
    "&.mdc-deprecated-list": {
        padding: 0
    }
});

export const NothingToShow = () => {
    return (
        <List className={submenuList} style={{ opacity: 0.4 }}>
            <ListItem className={submenuItems} ripple={false} disabled>
                <Typography use={"body2"} className={linkStyle}>
                    Nothing to show.
                </Typography>
            </ListItem>
        </List>
    );
};
