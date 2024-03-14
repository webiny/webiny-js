import React from "react";
import { css } from "emotion";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { Avatar } from "@webiny/ui/Avatar";
import { makeDecoratable } from "@webiny/app-serverless-cms";

const avatarImage = css({
    height: "40px !important",
    width: "40px !important",
    borderRadius: "50%",
    display: "inline-block",
    ">div": {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

const linkStyles = css({
    backgroundColor: "var(--mdc-theme-background)",
    marginTop: -25,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textDecoration: "none",
    display: "block",
    ">.mdc-deprecated-list-item": {
        display: "flex",
        height: "65px !important",
        marginTop: 15,
        ".avatar": {
            marginTop: 10
        }
    },
    "h3, h3>.mdc-typography--headline6": {
        lineHeight: "1em !important"
    },
    ".mdc-menu &.mdc-deprecated-list-item": {
        ">.mdc-deprecated-list-item__text": {
            fontWeight: "bold"
        }
    },
    ".mdc-deprecated-list-item": {
        height: "auto",
        ".mdc-typography--headline6": {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            maxWidth: 180,
            display: "block"
        },
        ".mdc-typography--subtitle2": {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            maxWidth: 180
        }
    }
});

export const UserInfo = makeDecoratable("UserInfo", () => {
    const security = useSecurity();

    if (!security || !security.identity) {
        return null;
    }

    const { id, displayName } = security.identity;

    return (
        <div className={linkStyles}>
            <ListItem ripple={false} className={linkStyles}>
                <ListItemGraphic className={avatarImage}>
                    <Avatar
                        className={"avatar"}
                        src={null}
                        alt={displayName}
                        fallbackText={displayName}
                    />
                </ListItemGraphic>
                <div>
                    <Typography use={"headline6"}>{displayName}</Typography>
                    <Typography use={"subtitle2"}>{id}</Typography>
                </div>
            </ListItem>
        </div>
    );
});
