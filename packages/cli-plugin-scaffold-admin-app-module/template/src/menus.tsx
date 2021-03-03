import React from "react";
import { AdminMenuPlugin } from "@webiny/app-admin/types";
import { ReactComponent as Icon } from "./assets/round-ballot-24px.svg";

export default (): AdminMenuPlugin => ({
    type: "admin-menu",
    name: "admin-menu-entities",
    render({ Menu, Item }) {
        return (
            <Menu name="menu-entities" label={"Books"} icon={<Icon />}>
                <Item label={"Books"} path={"/entities/"} />
            </Menu>
        );
    }
});
