//@flow
import React from "react";
import { Link } from "react-router-dom";
import { css } from "emotion";
import { useSecurity } from "@webiny/app-security/admin/hooks/useSecurity";
import { Image } from "@webiny/app/components";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { Avatar } from "@webiny/ui/Avatar";

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
    marginTop: -15,
    paddingTop: 15,
    paddingBottom: 15,
    textDecoration: "none",
    display: "block",
    "&:hover": {
        textDecoration: "none"
    },
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

const UserInfo = () => {
    const security = useSecurity();

    if (!security || !security.user) {
        return null;
    }

    const { email, fullName, avatar } = security.user;

    return (
        <Link to={"/account"} className={linkStyles}>
            <ListItem ripple={false}>
                <ListItemGraphic className={avatarImage}>
                    <Avatar
                        src={avatar && avatar.src}
                        alt={fullName}
                        fallbackText={fullName}
                        renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                    />
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
