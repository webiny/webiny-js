import React from "react";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "./assets/round-ballot-24px.svg";

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "admin-menu-entities",
    render({ Menu, Item }) {
        return (
            <Menu name="menu-entities" label={"Targets"} icon={<Icon />}>
                <Item label={"Targets"} path={"/entities/"} />
            </Menu>
        );
    }
};

export default plugin;
