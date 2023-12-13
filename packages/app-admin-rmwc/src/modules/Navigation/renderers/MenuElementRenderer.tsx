import React from "react";
import { useMenuItem } from "@webiny/app-admin";

export const MenuElementRenderer = (PrevMenuItem: React.ComponentType) => {
    return function MenuComponent() {
        const { menuItem } = useMenuItem();
        if (!menuItem || !menuItem.element) {
            return <PrevMenuItem />;
        }

        return menuItem.element;
    };
};
