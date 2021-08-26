import { Menu, MenuItem } from "~/types";
import { MenuPlugin } from "~/plugins/MenuPlugin";
import pick from "lodash/pick";

export default new MenuPlugin<Menu, MenuItem>({
    async modifyMenuItemProperties({ items: menuItems, index, originalValue }) {
        const defaultProperties = ["title", "children", "path", "url", "id", "type"];
        // mutate the original value by reference
        menuItems[index] = pick(originalValue, defaultProperties);
    }
});
