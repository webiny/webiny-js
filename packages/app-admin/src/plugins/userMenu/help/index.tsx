import React from "react";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import Help from "./Help";

const plugin: AdminHeaderUserMenuPlugin = {
    name: "admin-user-menu-help",
    type: "admin-header-user-menu",
    render() {
        return <Help />;
    }
};

export default plugin;
