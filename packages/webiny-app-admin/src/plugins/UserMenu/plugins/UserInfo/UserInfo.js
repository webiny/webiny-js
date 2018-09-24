//@flow
import React from "react";
import { css } from "emotion";
import { app } from "webiny-app";
import { ListItem, ListItemGraphic } from "webiny-ui/List";
import { Typography } from "webiny-ui/Typography";
import { Link } from "webiny-app/router";
import classNames from "classnames";

const avatarImage = css({
    height: "40px !important",
    width: "40px !important",
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
    display: "block",
    "h3, h3>.mdc-typography--headline6": {
        lineHeight: "1em !important"
    },
    ".mdc-menu &.mdc-list-item": {
        ">.mdc-list-item__text": {
            fontWeight: "bold"
        }
    },
    ".mdc-list-item": {
        height: "auto",
        ".mdc-typography--headline6": {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            maxWidth: 180,
            display: "block"
        }
    }
});

class UserInfo extends React.Component<{}> {
    componentDidMount() {
        app.security.onIdentity(() => {
            this.forceUpdate();
        });
    }

    render() {
        const {
            security: { identity }
        } = app;

        // When user logs out, identity becomes null.
        if (!identity) {
            return null;
        }

        const { email, fullName, avatar } = identity;

        return (
            <Link route={"Account"} className={linkStyles}>
                <ListItem ripple={false}>
                    <ListItemGraphic className={avatarImage}>
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
    }
}

export default UserInfo;
