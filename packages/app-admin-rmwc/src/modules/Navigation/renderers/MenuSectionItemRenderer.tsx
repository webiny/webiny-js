import React, { useCallback } from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { List, ListItem } from "@webiny/ui/List";
import { useNavigation } from "../index";
import { useMenuItem } from "@webiny/app-admin";

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
    ".mdc-drawer &.mdc-list-item": {
        paddingLeft: 0,
        margin: 0,
        padding: 0
    }
});

const submenuList = css({
    "&.mdc-list": {
        padding: 0
    }
});

export const MenuSectionItemRenderer = PrevMenuItem => {
    return function MenuSectionItem() {
        const { setVisible } = useNavigation();
        const { menuItem, depth } = useMenuItem();

        const hideMenu = useCallback(() => setVisible(false), []);
        const shouldRender = depth > 0 && Boolean(menuItem.path);

        if (!shouldRender) {
            return <PrevMenuItem />;
        }

        return (
            <List className={submenuList}>
                <ListItem className={submenuItems} data-testid={menuItem.testId}>
                    {menuItem.path ? (
                        <Link
                            className={linkStyle}
                            to={menuItem.path}
                            onClick={menuItem.onClick || hideMenu}
                        >
                            {menuItem.label}
                        </Link>
                    ) : (
                        <span onClick={menuItem.onClick || null} className={linkStyle}>
                            {menuItem.label}
                        </span>
                    )}
                </ListItem>
            </List>
        );
    };
};
