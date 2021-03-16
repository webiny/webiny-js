import React from "react";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "./assets/round-ballot-24px.svg";

export default (): AdminMenuPlugin => ({
    type: "admin-menu",
    name: "admin-menu-targets",
    render({ Menu, Item }) {
        return (
            <Menu name="menu-targets" label={"Targets"} icon={<Icon />}>
                <Item label={"Targets"} path={"/targets/"} />
            </Menu>
        );
    }
});
