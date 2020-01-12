import React from "react";
import { HeaderUserMenuPlugin } from "@webiny/app-admin/types";
import DarkMode from "./DarkMode";

const plugin: HeaderUserMenuPlugin = {
    name: "user-menu-dark-mode",
    type: "header-user-menu",
    render() {
        return <DarkMode />;
    }
};

export default plugin;
