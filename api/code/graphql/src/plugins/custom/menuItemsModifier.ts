import { Menu, MenuItem } from "@webiny/api-page-builder/types";
import { MenuPlugin } from "@webiny/api-page-builder/plugins/MenuPlugin";
import pick from "lodash.pick";

export interface CardMenuItem extends MenuItem {
    action: {
        label: string;
        link: string;
    };
    poster: {
        image: Record<string, any>;
        alt: string;
    };
}

const getProperties = (type: string): string[] => {
    const defaults = ["title", "children", "path", "url", "id", "type"];

    if (type === "card") {
        return [...defaults, "action", "poster"];
    }
    return defaults;
};

export default new MenuPlugin<Menu, CardMenuItem>({
    async modifyMenuItemProperties({ items: menuItems, index, originalValue }) {
        const type = menuItems[index].type;
        // mutate the original value by reference
        menuItems[index] = pick(originalValue, getProperties(type));
    }
});
