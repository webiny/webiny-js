import React, { useMemo } from "react";
import { AdminConfig, useLocalStorageValues, useLocalStorageValue } from "@webiny/app-admin";
import { createPinnedKey, PINNED_ORDER_KEY, PinnableMenuItem } from "./PinnableMenuItem.js";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";
import { Separator } from "@webiny/admin-ui";
import { createGenericContext } from "@webiny/app-admin";

/**
 * Context for providing a parent menu's icon in navigation components.
 *
 * @typeParam icon - React.ReactNode representing the icon for the parent menu.
 */
const MenuParentContext = createGenericContext<{ icon: React.ReactNode }>("MenuParent");

/**
 * Hook to access the parent menu icon from the MenuParentContext.
 *
 * @returns {React.ReactNode | undefined} The icon provided by the parent menu context, or `undefined` if the context is not available.
 *
 * @example
 * // Usage inside a component wrapped by MenuParentContext.Provider
 * const icon = useMenuParentIcon();
 * if (icon) {
 *   return <span>{icon}</span>;
 * }
 *
 * @remarks
 * If called outside of a MenuParentContext.Provider, this hook will return `undefined`.
 */
export const useMenuParentIcon = () => {
    try {
        const { icon } = MenuParentContext.useHook();
        return icon;
    } catch {
        return undefined;
    }
};

/**
 * Retrieves the icon from the parent menu of a given child menu.
 *
 * @param childMenu - The menu configuration object representing the child menu.
 * @param allMenus - An array of all menu configuration objects.
 * @returns The React node representing the parent's icon, or `undefined` if no parent or icon is found.
 *
 * @remarks
 * - If the child menu does not have a parent, or the parent menu's element is not a valid React element, returns `undefined`.
 * - Assumes that the parent menu's element has an `icon` prop.
 *
 * @example
 * const icon = getParentIcon(childMenu, allMenus);
 * if (icon) {
 *   // Render the icon
 * }
 */
const getParentIcon = (
    childMenu: MenuConfig,
    allMenus: MenuConfig[]
): React.ReactNode | undefined => {
    if (!childMenu.parent) {
        return undefined;
    }
    const parentMenu = allMenus.find(menu => menu.name === childMenu.parent);
    if (!parentMenu || !React.isValidElement(parentMenu.element)) {
        return undefined;
    }
    // Type assertion to fix 'unknown' type error
    return (parentMenu.element.props as { icon?: React.ReactNode }).icon;
};

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
    menus.map(({ name }) => createPinnedKey(name));

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
    const pinned = menus.filter(({ name }) => pinnedStates[createPinnedKey(name)]);

    return pinned.sort((a, b) => {
        const aIdx = pinnedOrder.indexOf(a.name);
        const bIdx = pinnedOrder.indexOf(b.name);
        return (
            (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) -
            (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx)
        );
    });
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
    const rawPinnedOrder = useLocalStorageValue(PINNED_ORDER_KEY);
    const [pinnableMenus, pinnableKeys, pinnedOrder] = useMemo(() => {
        const menus = getPinnableMenus(menuItems);
        const keys = getPinnableKeys(menus);
        const order = parsePinnedOrder(rawPinnedOrder);
        return [menus, keys, order];
    }, [menuItems, rawPinnedOrder]);
    const pinnedStates = useLocalStorageValues(pinnableKeys);

    const pinnedItems = useMemo(
        () => getSortedPinnedItems(pinnableMenus, pinnedStates, pinnedOrder),
        [pinnableMenus, pinnedStates, pinnedOrder]
    );

    if (!pinnedItems.length) {
        return null;
    }

    return (
        <>
            {pinnedItems.map(m => (
                <PinnableMenuItem key={m.name} name={m.name}>
                    <MenuParentContext.Provider icon={getParentIcon(m, menuItems)}>
                        {m.element}
                    </MenuParentContext.Provider>
                </PinnableMenuItem>
            ))}
            <div className="wby-px-sm wby-py-xs">
                <Separator />
            </div>
        </>
    );
};
