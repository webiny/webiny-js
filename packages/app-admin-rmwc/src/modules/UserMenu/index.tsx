import React, { Fragment } from "react";
import { css } from "emotion";
import {
    Compose,
    UserMenuHandle,
    UserMenuHandleRenderer as UserMenuHandleRendererSpec,
    UserMenuRenderer as UserMenuRendererSpec,
    UserMenuItems,
    UserMenuItemRenderer as UserMenuItemRendererSpec,
    useUserMenuItem,
    useUserMenu
} from "@webiny/app-admin";
import { Menu } from "@webiny/ui/Menu";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Link } from "@webiny/react-router";
import { useSecurity } from "@webiny/app-security";
import { Avatar } from "@webiny/ui/Avatar";
import { Image } from "@webiny/app/components";
import { TopAppBarActionItem } from "@webiny/ui/TopAppBar";

const UserMenuRendererImpl = () => {
    return function UserMenu() {
        const security = useSecurity();
        const { menuItems } = useUserMenu();

        if (!security || !security.identity) {
            return null;
        }

        return (
            <Menu anchor={"topEnd"} handle={<TopAppBarActionItem icon={<UserMenuHandle />} />}>
                <List data-testid="logged-in-user-menu-list">
                    <UserMenuItems menuItems={menuItems} />
                </List>
            </Menu>
        );
    };
};

const UserMenuHandleRendererImpl = () => {
    return function UserMenuHandle() {
        const { identity } = useSecurity();

        if (!identity) {
            return null;
        }

        const profile = identity.profile;

        if (!profile) {
            return (
                <Avatar
                    data-testid="logged-in-user-menu-avatar"
                    src={undefined}
                    alt={identity.displayName}
                    fallbackText={identity.displayName}
                    renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                />
            );
        }

        const { firstName, lastName, avatar, gravatar } = profile;
        const fullName = `${firstName} ${lastName}`;

        return (
            <Avatar
                data-testid="logged-in-user-menu-avatar"
                src={avatar ? avatar.src : gravatar}
                alt={fullName}
                fallbackText={fullName}
                renderImage={props => <Image {...props} transform={{ width: 100 }} />}
            />
        );
    };
};

const linkStyles = css({
    "&:hover": {
        textDecoration: "none"
    }
});

const UserMenuItemRendererImpl = () => {
    return function UserMenuItemRenderer() {
        const { label, path, icon, onClick, element } = useUserMenuItem();

        if (element) {
            return element;
        }

        if (path) {
            return (
                <Link to={path} className={linkStyles}>
                    <ListItem>
                        <ListItemGraphic>{icon ? <Icon icon={icon} /> : null}</ListItemGraphic>
                        {label}
                    </ListItem>
                </Link>
            );
        }

        return (
            <ListItem onClick={onClick}>
                <ListItemGraphic>{icon ? <Icon icon={icon} /> : null}</ListItemGraphic>
                {label}
            </ListItem>
        );
    };
};

export const UserMenu = () => {
    return (
        <Fragment>
            <Compose component={UserMenuHandleRendererSpec} with={UserMenuHandleRendererImpl} />
            <Compose component={UserMenuRendererSpec} with={UserMenuRendererImpl} />
            <Compose component={UserMenuItemRendererSpec} with={UserMenuItemRendererImpl} />
        </Fragment>
    );
};
