import React from "react";
import { ReactComponent as Icon } from "./assets/round-ballot-24px.svg";
import { MenuPlugin } from "@webiny/app-admin/plugins/MenuPlugin";

/**
 * Registers "Target Data Models" main menu item.
 */
export default new MenuPlugin({
    render({ Menu, Item }) {
        return (
            <Menu name="menu-target-data-models" label={"Target Data Models"} icon={<Icon />}>
                <Item label={"Target Data Models"} path={"/target-data-models"} />
            </Menu>
        );
    }
});
