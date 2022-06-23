import { useMenuItem } from "@webiny/app-admin";
import React from "react";

export const MenuGroupRenderer = (PrevMenuItem: React.FC): React.FC => {
    return function MenuGroup() {
        const { menuItem } = useMenuItem();

        const label = menuItem ? menuItem.label || "" : "";
        /**
         * We render the group only if it is not an APW group
         */
        if (label.match(/^apw$/i) === null) {
            return <PrevMenuItem />;
        }
        return null;
    };
};
