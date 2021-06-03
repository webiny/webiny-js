import React from "react";
import { ReactComponent as Icon } from "./assets/round-ballot-24px.svg";
import { MenuPlugin } from "@webiny/app-admin/plugins/MenuPlugin";

export default new MenuPlugin({
    render({ Menu, Item }) {
        return (
            <Menu name="menu-targets" label={"Targets"} icon={<Icon />}>
                <Item label={"Targets"} path={"/targets/"} />
            </Menu>
        );
    }
});
