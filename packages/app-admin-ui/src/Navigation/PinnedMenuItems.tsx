import React, { useMemo } from "react";
import { AdminConfig, useLocalStorageValues, useLocalStorageValue } from "@webiny/app-admin";
import { PINNED_KEY, PINNED_ORDER_KEY, PinnableMenuItem } from "./PinnableMenuItem.js";

const { Menu } = AdminConfig;

/**
 * Props for the PinnedMenuItems component.
 * @property menuItems - Array of menu item objects from admin config.
 */
export interface PinnedMenuItemsProps {
    menuItems: ReturnType<typeof AdminConfig.useAdminConfig>["menus"];
}

/**
 * Filters menu items to include only those that are pinnable.
 * @param menuItems - Array of menu item objects.
 * @returns Array of pinnable menu items.
 */
const getPinnableMenus = (menuItems: PinnedMenuItemsProps["menuItems"]) =>
    menuItems?.filter(({ pinnable }) => pinnable) || [];

/**
 * Generates local storage keys for each pinnable menu item.
 * @param menus - Array of menu item objects.
 * @returns Array of local storage key strings.
 */
const getPinnableKeys = (menus: PinnedMenuItemsProps["menuItems"]) =>
    menus.map(({ name }) => PINNED_KEY(name));

/**
 * Parses the pinned order from a raw local storage value.
 * @param rawOrder - Value from local storage (string or array).
 * @returns Array of menu item names in pinned order.
 *
 * Note: If parsing fails, returns an empty array.
 */
const parsePinnedOrder = (rawOrder: unknown): string[] => {
    if (Array.isArray(rawOrder)) {
        return rawOrder;
    }
    if (typeof rawOrder === "string") {
        try {
            const parsed = JSON.parse(rawOrder);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            // ignore parse error, fallback to empty array
        }
    }
    return [];
};

/**
 * Sorts pinned menu items according to user-defined order.
 * @param menus - Array of menu item objects.
 * @param pinnedStates - Object mapping menu item keys to pinned state (boolean).
 * @param pinnedOrder - Array of menu item names in desired order.
 * @returns Array of sorted pinned menu items.
 */
const getSortedPinnedItems = (
    menus: PinnedMenuItemsProps["menuItems"],
    pinnedStates: Record<string, boolean>,
    pinnedOrder: string[]
) => {
    const pinned = menus.filter(({ name }) => pinnedStates[PINNED_KEY(name)]);
    return pinned.sort((a, b) => pinnedOrder.indexOf(a.name) - pinnedOrder.indexOf(b.name));
};

/**
 * Renders a group of pinned menu items in the admin UI.
 *
 * - Uses local storage to determine which menu items are pinned and their order.
 * - Only displays the group if there are pinned items.
 *
 * @param props.menuItems - Array of menu item objects from admin config.
 * @returns React fragment containing the "Pinned" menu group and its items, or null if none are pinned.
 *
 * @example
 * <PinnedMenuItems menuItems={menus} />
 */
export const PinnedMenuItems = ({ menuItems }: PinnedMenuItemsProps) => {
    const pinnableMenus = useMemo(() => getPinnableMenus(menuItems), [menuItems]);
    const pinnableKeys = useMemo(() => getPinnableKeys(pinnableMenus), [pinnableMenus]);
    const pinnedStates = useLocalStorageValues(pinnableKeys);
    const rawPinnedOrder = useLocalStorageValue(PINNED_ORDER_KEY);
    const pinnedOrder = useMemo(() => parsePinnedOrder(rawPinnedOrder), [rawPinnedOrder]);

    const pinnedItems = useMemo(
        () => getSortedPinnedItems(pinnableMenus, pinnedStates, pinnedOrder),
        [pinnableMenus, pinnedStates, pinnedOrder]
    );

    if (!pinnedItems.length) {
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
