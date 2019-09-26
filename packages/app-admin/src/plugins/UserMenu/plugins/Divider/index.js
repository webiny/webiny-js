import React from "react";
import shortid from "shortid";
import { MenuDivider } from "@webiny/ui/Menu";

export default () => ({
    name: "user-menu-divider-" + shortid.generate(),
    type: "header-user-menu",
    render() {
        return <MenuDivider />;
    }
});
