import React from "react";
import { useMenuItem } from "@webiny/app-admin";

export const MenuElementRenderer = PrevMenuItem => {
    return function MenuComponent() {
        const { menuItem } = useMenuItem();
        
        return menuItem.element || <PrevMenuItem />;
    };
};
