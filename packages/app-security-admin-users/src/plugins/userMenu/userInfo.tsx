import React from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { Image } from "@webiny/app/components";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { Avatar } from "@webiny/ui/Avatar";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";

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
    "&:hover": {
        textDecoration: "none"
    },
    ">.mdc-list-item": {
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
        },
        ".mdc-typography--subtitle2": {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            maxWidth: 180
        }
    }
});

const UserInfo = () => {
    const security = useSecurity();

    if (!security || !security.identity) {
        return null;
    }

    const { login, firstName, lastName, avatar, gravatar } = security.identity;
    const fullName = `${firstName} ${lastName}`;

    return (
        <Link to={"/account"} className={linkStyles}>
            <ListItem ripple={false}>
                <ListItemGraphic className={avatarImage}>
                    <Avatar
                        className={"avatar"}
                        src={avatar ? avatar.src : gravatar}
                        alt={fullName}
                        fallbackText={fullName}
                        renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                    />
                </ListItemGraphic>
                <div>
                    <h3>
                        <Typography use={"headline6"}>{fullName}</Typography>
                    </h3>
                    <Typography use={"subtitle2"}>{login}</Typography>
                </div>
            </ListItem>
        </Link>
    );
};

export default () => {
    return new UIViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement("userMenu");
        if (!userMenu) {
            return;
        }

        const userInfo = new GenericElement("userInfo", () => <UserInfo />);
        userInfo.moveToTheBeginningOf(userMenu);
        view.refresh();
    });
};
