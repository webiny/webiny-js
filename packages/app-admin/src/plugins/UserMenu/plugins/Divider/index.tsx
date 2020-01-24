import React from "react";
import shortid from "shortid";
import { HeaderUserMenuPlugin } from "@webiny/app-admin/types";
import { MenuDivider } from "@webiny/ui/Menu";

export default (): HeaderUserMenuPlugin => ({
    name: "user-menu-divider-" + shortid.generate(),
    type: "header-user-menu",
    render() {
        return <MenuDivider />;
    }
});
