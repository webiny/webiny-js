import React from "react";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import Help from "./Help";

export default (): AdminHeaderUserMenuPlugin => ({
    name: "admin-user-menu-help",
    type: "admin-header-user-menu",
    render() {
        return <Help />;
    }
});
