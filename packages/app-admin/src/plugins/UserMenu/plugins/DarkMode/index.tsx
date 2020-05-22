import React from "react";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import DarkMode from "./DarkMode";

const plugin: AdminHeaderUserMenuPlugin = {
    name: "admin-user-menu-dark-mode",
    type: "admin-header-user-menu",
    render() {
        return <DarkMode />;
    }
};

export default plugin;
