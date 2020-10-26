import React from "react";
import shortid from "shortid";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import { MenuDivider } from "@webiny/ui/Menu";

export default (): AdminHeaderUserMenuPlugin => ({
    name: "admin-user-menu-divider-" + shortid.generate(),
    type: "admin-header-user-menu",
    render() {
        return <MenuDivider />;
    }
});
