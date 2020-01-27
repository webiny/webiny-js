import React from "react";
import { HeaderUserMenuPlugin } from "@webiny/app-admin/types";
import Help from "./Help";

const plugin: HeaderUserMenuPlugin = {
    name: "user-menu-help",
    type: "header-user-menu",
    render() {
        return <Help />;
    }
};

export default plugin;
