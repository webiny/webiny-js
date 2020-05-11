import React from "react";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import DefaultHandle from "./DefaultHandle";

const plugin: AdminHeaderUserMenuPlugin = {
    name: "admin-header-user-menu-handle",
    type: "admin-header-user-menu-handle",
    render() {
        return <DefaultHandle />;
    }
};

export default plugin;
