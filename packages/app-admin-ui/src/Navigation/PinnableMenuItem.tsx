import React from "react";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { ReactComponent as UnPinIcon } from "@webiny/icons/push_pin_off.svg";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";

export const createPinnedKey = (name: string) => `navigation/${name}/pinned`;

export const PINNED_ORDER_KEY = "navigation/order/pinned";

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

const usePinnedMenuItem = (name: string) => {
    const pinKey = createPinnedKey(name);
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

export interface PinnableMenuItemProps {
    menu: MenuConfig;
}

export const PinnableMenuItem = ({ menu }: PinnableMenuItemProps) => {
    const { isPinned, pin, unpin } = usePinnedMenuItem(menu.name);

    const { element } = menu;

    if (!element) {
        return null;
    }

    if (!menu.pinnable) {
        return element;
    }

    return React.cloneElement<any>(element, {
        key: menu.parent + menu.name,
        action: (
            <Sidebar.Item.Action
                element={isPinned ? <UnPinIcon /> : <PinIcon />}
                onClick={isPinned ? unpin : pin}
            />
        )
    });
};
