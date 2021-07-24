import React from "react";
import { AdminHeaderUserMenuHandlePlugin } from "../../../types";
import DefaultHandle from "./DefaultHandle";

const plugin: AdminHeaderUserMenuHandlePlugin = {
    name: "admin-header-user-menu-handle",
    type: "admin-header-user-menu-handle",
    render() {
        return <DefaultHandle />;
    }
};

export default plugin;
