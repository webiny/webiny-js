import React from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
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
    marginTop: -25,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textDecoration: "none",
    display: "block",
    "&:hover": {
        textDecoration: "none"
    },
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
        ".mdc-typography--body2": {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            maxWidth: 180
        }
    }
});

export const UserInfo = () => {
    const security = useSecurity();

    if (!security || !security.identity) {
        return null;
    }

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = security.identity;

    let wrapper: any = { Component: Link, props: { to: "/account" } };
    if (currentTenant && defaultTenant && currentTenant.id !== defaultTenant.id) {
        wrapper = { Component: "div", props: {} };
    }

    const profile = security.identity.profile;
    if (!profile) {
        const { displayName } = security.identity;

        return (
            <wrapper.Component {...wrapper.props} className={linkStyles}>
                <ListItem ripple={false} className={linkStyles}>
                    <ListItemGraphic className={avatarImage}>
                        <Avatar
                            className={"avatar"}
                            src={undefined}
                            alt={displayName}
                            fallbackText={displayName}
                            renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                        />
                    </ListItemGraphic>
                    <div>
                        <h3>
                            <Typography use={"headline6"}>{displayName}</Typography>
                        </h3>
                    </div>
                </ListItem>
            </wrapper.Component>
        );
    }

    const { email, firstName, lastName, avatar, gravatar } = profile;
    const fullName = `${firstName} ${lastName}`;

    return (
        <wrapper.Component {...wrapper.props} className={linkStyles}>
            <ListItem ripple={false} className={linkStyles}>
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
                    <Typography use={"body2"}>{email}</Typography>
                </div>
            </ListItem>
        </wrapper.Component>
    );
};

export default () => {
    console.log(
        `[DEPRECATED] Import "@webiny/app-admin-users-cognito/plugins/userMenu/userInfo" is no longer used!`
    );
    return { type: "dummy" };
};
