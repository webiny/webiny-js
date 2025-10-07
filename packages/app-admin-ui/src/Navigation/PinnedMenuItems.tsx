import React, { useMemo } from "react";
import { AdminConfig, useLocalStorageValues, useAdminConfig } from "@webiny/app-admin";
import { getPinnedKey, PinnableMenuItem } from "./PinnableMenuItem.js";

const { Menu } = AdminConfig;

type MenuItems = ReturnType<typeof useAdminConfig>["menus"];

/**
 * Props for the {@link PinnedMenuItems} component.
 * @property {MenuItems} menuItems - Array of menu item objects from admin config.
 */
export interface PinnedMenuItemsProps {
    menuItems: MenuItems;
}

/**
 * Renders a group of pinned menu items in the admin UI navigation.
 *
 * This component filters the provided menu items to display only those that are marked as "pinned"
 * by the user (persisted in local storage). If any items are pinned, a "Pinned" group header is shown.
 *
 * @param {PinnedMenuItemsProps} props - Component props.
 * @param {MenuItems} props.menuItems - Array of menu item objects from admin config.
 * @returns {JSX.Element} Fragment containing the pinned menu items group and its items.
 *
 * @example
 * <PinnedMenuItems menuItems={menus} />
 *
 * @remarks
 * - Uses local storage to persist pinned state per menu item.
 * - Only menu items with the `pinnable` property set to true can be pinned.
 * - Relies on `useLocalStorageValues` and `getPinnedKey` for state management.
 */
export const PinnedMenuItems = ({ menuItems }: PinnedMenuItemsProps) => {
    // Extract pinnable menu items once for reuse
    const pinnableMenus = useMemo(
        () => menuItems?.filter(menu => menu.pinnable) || [],
        [menuItems]
    );

    // Get keys for pinnable items
    const pinnableKeys = useMemo(
        () => pinnableMenus.map(menu => getPinnedKey(menu.name)),
        [pinnableMenus]
    );

    // Get pinned states from local storage
    const pinnableStates = useLocalStorageValues(pinnableKeys);

    // Filter only pinned items
    const pinnedItems = useMemo(
        () => pinnableMenus.filter(menu => pinnableStates[getPinnedKey(menu.name)]),
        [pinnableMenus, pinnableStates]
    );

    if (pinnedItems.length === 0) {
        return null;
    }

    return (
        <>
            <Menu.Group text="Pinned" />
            {pinnedItems.map(({ name, element }) => (
                <PinnableMenuItem key={name} name={name}>
                    {element}
                </PinnableMenuItem>
            ))}
        </>
    );
};
