import React from "react";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "@webiny/app-page-builder/admin/assets/round-ballot-24px.svg";

const plugin: AdminMenuPlugin = {
    type: "admin-menu",
    name: "admin-menu-graphql-entities",
    render({ Menu, Item }) {
        return (
            <Menu name="menu-entities" label={"Entities"} icon={<Icon />}>
                <Item label={"Entities"} path={"/entities/"} />
            </Menu>
        );
    }
};

export default plugin;
