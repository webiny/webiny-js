import React, { useCallback } from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { useMenuItem } from "@webiny/app-admin";
import { Icon } from "@webiny/ui/Icon";
import { useNavigation } from "../index";

const listItemStyle = css({
    ".mdc-list &.mdc-list-item:hover": {
        cursor: "pointer",
        backgroundColor: "var(--mdc-theme-background)"
    }
});


export const MenuLinkRenderer = PrevMenuItem => {
    return function MenuLink() {
        const { setVisible } = useNavigation();
        const { menuItem, depth } = useMenuItem();

        const hideMenu = useCallback(() => setVisible(false), []);
        const shouldRender = depth === 0 && menuItem.tags.includes("footer");

        if (!shouldRender) {
            return <PrevMenuItem />;
        }

        const withLink = content => {
            return (
                <Link
                    to={menuItem.path}
                    target={menuItem.target}
                    data-testid={menuItem.testId}
                    onClick={menuItem.onClick || hideMenu}
                >
                    {content}
                </Link>
            );
        };

        const item = (
            <ListItem
                ripple={false}
                className={listItemStyle}
                onClick={menuItem.onClick || hideMenu}
            >
                {menuItem.icon ? (
                    <ListItemGraphic>
                        <Icon icon={menuItem.icon} />
                    </ListItemGraphic>
                ) : null}
                {menuItem.label}
            </ListItem>
        );

        return menuItem.path ? withLink(item) : item;
    };
};
