import React from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { Image } from "@webiny/app/components";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { Avatar } from "@webiny/ui/Avatar";
import { useIsDefaultTenant } from "./useIsDefaultTenant";

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

interface UserInfoProps {
    /**
     * Provide a route to the user's account view.
     * It is optional, because in reality, only Cognito allows you to update your profile, and only when Webiny is managing
     * those Cognito identities. If Cognito uses federated identity providers, you won't be able to update your account at all.
     */
    accountRoute?: `/${string}`;
}

export const UserInfo = ({ accountRoute }: UserInfoProps) => {
    const security = useSecurity();

    if (!security || !security.identity) {
        return null;
    }

    const { profile, displayName } = security.identity;

    // Start with the assumption that the user doesn't have a profile in the system (external IDP).
    let listItem: JSX.Element = <UserInfoListItem displayName={displayName} />;

    if (profile) {
        const { email, firstName, lastName, avatar, gravatar } = profile;
        const fullName = `${firstName} ${lastName}`;

        listItem = (
            <UserInfoListItem
                displayName={fullName}
                avatarSrc={avatar ? avatar.src : gravatar}
                email={email}
            />
        );
    }

    return (
        <UserInfoListItemContainer accountRoute={accountRoute} className={linkStyles}>
            {listItem}
        </UserInfoListItemContainer>
    );
};

interface UserInfoListItemContainer {
    accountRoute?: `/${string}`;
    className: string;
    children: React.ReactNode;
}

const UserInfoListItemContainer = ({
    accountRoute,
    className,
    children
}: UserInfoListItemContainer) => {
    const isDefaultTenant = useIsDefaultTenant();

    // If there's no "accountRoute", or the user is not on his default tenant, don't render the link to "Account Details".
    if (!accountRoute || !isDefaultTenant) {
        return <div className={className}>{children}</div>;
    }

    return (
        <Link to={accountRoute} className={className}>
            {children}
        </Link>
    );
};

interface UserInfoListItemProps {
    displayName: string;
    email?: string;
    avatarSrc?: string;
}

const UserInfoListItem = ({ avatarSrc, displayName, email }: UserInfoListItemProps) => {
    return (
        <ListItem ripple={false} className={linkStyles}>
            <ListItemGraphic className={avatarImage}>
                <Avatar
                    className={"avatar"}
                    src={avatarSrc}
                    alt={displayName}
                    fallbackText={displayName}
                    renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                />
            </ListItemGraphic>
            <div>
                <Typography use={"headline6"}>{displayName}</Typography>
                {email ? <Typography use={"body2"}>{email}</Typography> : null}
            </div>
        </ListItem>
    );
};

export default () => {
    console.log(
        `[DEPRECATED] Import "@webiny/app-admin-users-cognito/plugins/userMenu/userInfo" is no longer used!`
    );
    return { type: "dummy" };
};
