import React, { useMemo } from "react";
import { AdminConfig, useLocalStorageValues, useAdminConfig } from "@webiny/app-admin";
import { getPinnedKey, PinnableMenuItem } from "./PinnableMenuItem.js";

const { Menu } = AdminConfig;

type MenuItems = ReturnType<typeof useAdminConfig>["menus"];

export interface PinnedMenuItemsProps {
    menuItems: MenuItems;
}

export const PinnedMenuItems = ({ menuItems }: PinnedMenuItemsProps) => {
    const pinnableNames = useMemo(
        () => menuItems?.filter(menu => menu.pinnable).map(menu => getPinnedKey(menu.name)),
        [menuItems]
    );

    const pinnableStates = useLocalStorageValues(pinnableNames);
    const pinnedItems = menuItems.filter(menu => pinnableStates[getPinnedKey(menu.name)] === true);

    return (
        <>
            {pinnedItems.length > 0 ? <Menu.Group text="Pinned" /> : null}
            {pinnedItems.map(menu => (
                <PinnableMenuItem key={menu.name} name={menu.name}>
                    {menu.element}
                </PinnableMenuItem>
            ))}
        </>
    );
};
