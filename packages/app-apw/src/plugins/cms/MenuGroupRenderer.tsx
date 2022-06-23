import { useMenuItem } from "@webiny/app-admin";
import React from "react";

export const MenuGroupRenderer = (PrevMenuItem: React.FC): React.FC => {
    return function MenuGroup() {
        const { menuItem } = useMenuItem();

        const name = menuItem ? menuItem.name : "";
        /**
         * We render the group only if it is not an APW group
         */
        if (name.match(/apw/i) === null) {
            return <PrevMenuItem />;
        }
        return null;
    };
};
