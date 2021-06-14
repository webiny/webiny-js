import React from "react";
import { ReactComponent as Icon } from "./assets/round-ballot-24px.svg";
import { MenuPlugin } from "@webiny/app-admin/plugins/MenuPlugin";

/**
 * Adds Books main menu item.
 */
export default new MenuPlugin({
    render({ Menu, Item }) {
        return (
            <Menu name="menu-books" label={"Books"} icon={<Icon />}>
                <Item label={"Books"} path={"/books"} />
            </Menu>
        );
    }
});
