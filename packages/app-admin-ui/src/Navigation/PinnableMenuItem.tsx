import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";
import { useSidebar } from "@webiny/admin-ui";

/**
 * Props for the PinnableMenuItem component.
 *
 * @property name - Unique string identifier for the menu item. Used for localStorage keys.
 * @property children - React node(s) representing the menu item's content.
 */
type PinnableMenuItemProps = {
    name: string;
    children: React.ReactNode;
};

/**
 * Generates the localStorage key for a pinned menu item.
 *
 * @param name - The unique name of the menu item.
 * @returns The localStorage key string for the pinned state.
 */
export const pinnedKey = (name: string) => `navigation/${name}/pinned`;

/**
 * The localStorage key for the order of pinned menu items.
 */
export const PINNED_ORDER_KEY = "navigation/order/pinned";
/**
 * Parses the pinned order value from localStorage.
 *
 * @param order - The value retrieved from localStorage (string or array).
 * @returns An array of menu item names in pinned order.
 */
const parseOrder = (order: unknown): string[] => {
    if (Array.isArray(order)) {
        return order;
    }
    if (typeof order === "string") {
        try {
            const parsed = JSON.parse(order);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

/**
 * Custom hook to manage the pinned state of a menu item.
 *
 * @param name - Unique string identifier for the menu item.
 * @returns An object containing:
 *   - isPinned: boolean | undefined - Whether the menu item is pinned.
 *   - pin: () => void - Function to pin the menu item.
 *   - unpin: () => void - Function to unpin the menu item.
 *
 * @sideEffect Updates localStorage when pinning/unpinning.
 * @note The pinned state and order are persisted in localStorage.
 */
const usePinnedMenuItem = (name: string) => {
    const pinKey = pinnedKey(name);
    const pinOrder = useLocalStorageValue(PINNED_ORDER_KEY);
    const isPinned = useLocalStorageValue(pinKey);
    const { set, remove } = useLocalStorage();

    const updateOrder = (order: string[]) => set(PINNED_ORDER_KEY, JSON.stringify(order));

    const pin = () => {
        const order = parseOrder(pinOrder);
        if (!order.includes(name)) {
            updateOrder([...order, name]);
        }
        set(pinKey, true);
    };

    const unpin = () => {
        const order = parseOrder(pinOrder).filter(item => item !== name);
        updateOrder(order);
        remove(pinKey);
    };

    return { isPinned, pin, unpin };
};

/**
 * PinnableMenuItem component allows any menu item to be "pinned" by the user.
 * The pinned state is persisted in localStorage, making the menu item visually distinct and easily accessible.
 *
 * @param props - {@link PinnableMenuItemProps}
 * @returns JSX.Element - Renders the children and a pin/unpin icon.
 *
 * @example
 * <PinnableMenuItem name="dashboard">
 *   <MenuItem label="Dashboard" />
 * </PinnableMenuItem>
 *
 * @sideEffect Persists pinned state and order in localStorage.
 * @note The pin icon appears on hover and toggles the pinned state.
 */
export const PinnableMenuItem = ({ name, children }: PinnableMenuItemProps) => {
    const { isPinned, pin, unpin } = usePinnedMenuItem(name);
    const { pinned: isSidebarPinned } = useSidebar();

    return (
        <div className="wby-relative">
            {children}
            <div
                className={`wby-opacity-0 hover:wby-opacity-100 wby-absolute wby-right-sm wby-top-1/2 -wby-translate-y-1/2 wby-cursor-pointer ${isPinned && isSidebarPinned ? "wby-opacity-100" : ""}`}
            >
                <Icon
                    label={isPinned ? "Unpin menu item" : "Pin menu item"}
                    onClick={isPinned ? unpin : pin}
                    icon={<PinIcon />}
                    className="wby-fill-neutral-strong hover:wby-fill-neutral-xstrong"
                />
            </div>
        </div>
    );
};
