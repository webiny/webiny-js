import React from "react";
import type { MenuConfig } from "@webiny/app-admin/config/AdminConfig/Menu.js";
import { PinnableMenuItem } from "./PinnableMenuItem.js";

export interface MenusProps {
    menus: MenuConfig[];
    where?: { tags?: string[]; parent?: string };
}

// This component is called recursively to render root and nested menu items.
// The menu items are defined via AdminConfig.
export const SidebarMenuItems = (props: MenusProps) => {
    const { menus: allMenus, where = {} } = props;
    const filteredMenus = allMenus.filter(menu => {
        const whereParent = where.parent || null;
        const menuParent = menu.parent;
        if (whereParent !== menuParent) {
            return false;
        }

        const whereTags = where.tags || [];
        const menuTags = menu.tags || [];

        if (whereTags.length > 0) {
            // If not all tags are present, return false.
            return whereTags.every(tag => menuTags.includes(tag));
        }

        return menuTags.length === 0;
    });

    return filteredMenus.map(m => {
        if (!React.isValidElement(m.element)) {
            return null;
        }

        const hasChildMenus = allMenus.some(menu => menu.parent === m.name);
        if (hasChildMenus) {
            return React.cloneElement(
                m.element,
                { key: m.parent + m.name },
                <SidebarMenuItems menus={allMenus} where={{ parent: m.name }} />
            );
        }

        const menuItem = React.cloneElement(m.element, { key: m.parent + m.name });

        if (m.pinnable) {
            return (
                <PinnableMenuItem key={m.parent + m.name} name={m.name}>
                    {menuItem}
                </PinnableMenuItem>
            );
        }

        return menuItem;
    });
};
