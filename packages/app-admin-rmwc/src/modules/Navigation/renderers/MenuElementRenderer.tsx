import React from "react";
import { useMenuItem } from "@webiny/app-admin";

export const MenuElementRenderer = (PrevMenuItem: React.VFC): React.VFC => {
    return function MenuComponent() {
        const { menuItem } = useMenuItem();
        if (!menuItem || !menuItem.element) {
            return <PrevMenuItem />;
        }

        return menuItem.element;
    };
};
