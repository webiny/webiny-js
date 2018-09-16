//@flow
import React from "react";
import { css } from "emotion";
import { app } from "webiny-app";
import { ListItem, ListItemGraphic } from "webiny-ui/List";
import { Typography } from "webiny-ui/Typography";
import { Link } from "webiny-app/router";
import classNames from "classnames";

const avatarImage = css({
    height: 40,
    width: 40,
    borderRadius: "50%",
    display: "inline-block",
    "&.blank": {
        backgroundColor: "lightgray"
    }
});

const linkStyles = css({
    backgroundColor: "var(--mdc-theme-background)",
    marginTop: -15,
    paddingTop: 15,
    paddingBottom: 15,
    textDecoration: "none",
    display:'block',
    "h3, h3>.mdc-typography--headline6": {
        lineHeight: "1em !important"
    },
    ".mdc-menu &.mdc-list-item": {
        ">.mdc-list-item__text": {
            fontWeight: "bold"
        }
    }
});

const UserInfo = () => {
    const {
        security: {
            identity: { email, fullName, avatar }
        }
    } = app;

    return (
        <Link route={"Account"} className={linkStyles}>
            <ListItem ripple={false}>
                <ListItemGraphic className={avatar}>
                    {avatar ? (
                        <img className={avatarImage} src={avatar.src} alt={fullName} />
                    ) : (
                        <div className={classNames(avatarImage, "blank")} />
                    )}
                </ListItemGraphic>
                <div>
                    <h3>
                        <Typography use={"headline6"}>{fullName}</Typography>
                    </h3>
                    <Typography use={"subtitle2"}>{email}</Typography>
                </div>
            </ListItem>
        </Link>
    );
};

export default UserInfo;
