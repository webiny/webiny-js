import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import type { Decorator, GenericComponent } from "@webiny/app";
import { useMenuParentIcon } from "./PinnedMenuItems.js";

const { Menu } = AdminConfig;

/**
 * Decorator that injects a parent menu icon into a menu component if available.
 *
 * @template P - Props type, must include optional `icon` and any additional properties.
 * @param {GenericComponent<{ icon?: React.ReactNode } & Record<string, any>>} Original
 *   The original menu component to be decorated.
 * @returns {React.FC<P>}
 *   A new component that renders the original menu component with the parent icon (if present).
 *
 * @example
 * const DecoratedMenuItem = withParentIcon(Menu.Item);
 * <DecoratedMenuItem {...props} />
 *
 * @remarks
 * - Uses `useMenuParentIcon` hook to retrieve the icon.
 * - If no icon is found, renders the original component unchanged.
 */
const withParentIcon: Decorator<
    GenericComponent<{ icon?: React.ReactNode } & Record<string, any>>
> = Original => {
    return function MenuRenderer(props) {
        const icon = useMenuParentIcon();
        if (icon) {
            return <Original {...props} icon={icon} />;
        }
        return <Original {...props} />;
    };
};

const MenuItemWithParentIcon = Menu.Item.createDecorator(withParentIcon);
const MenuLinkWithParentIcon = Menu.Link.createDecorator(withParentIcon);

export const DecoratedMenu = () => {
    return (
        <>
            <MenuItemWithParentIcon />
            <MenuLinkWithParentIcon />
        </>
    );
};
