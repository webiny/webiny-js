import React, { Fragment } from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { MenuItems, useMenuItem } from "@webiny/app-admin";

const menuSectionTitle = css({
    marginLeft: 20,
    display: "flex",
    alignItems: "center",
    color: "var(--mdc-theme-on-surface)"
});

const iconWrapper = css({
    marginRight: 5,
    color: "var(--mdc-theme-on-surface)"
});

export const MenuSectionRenderer = (PrevMenuItem: React.ComponentType) => {
    return function MenuSection() {
        const { menuItem, depth } = useMenuItem();

        const shouldRender = depth === 1 && menuItem && menuItem.children.length > 0;

        if (!shouldRender) {
            return <PrevMenuItem />;
        } else if (!menuItem) {
            // TODO @ts-refactor check if to return component or null @pavel
            console.log("MenuSectionRenderer returning PrevMenuItem because no menuItem variable.");
            return <PrevMenuItem />;
        }

        if (!menuItem.children.length) {
            return null;
        }

        return (
            <Fragment>
                <div className={menuSectionTitle}>
                    <div className={iconWrapper}>{menuItem.icon}</div>
                    <Typography use="overline">{menuItem.label}</Typography>
                </div>
                <MenuItems menuItems={menuItem.children} />
            </Fragment>
        );
    };
};
