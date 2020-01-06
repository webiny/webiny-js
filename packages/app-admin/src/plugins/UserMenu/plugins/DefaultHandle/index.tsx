import React from "react";
import { HeaderUserMenuPlugin } from "@webiny/app-admin/types";
import DefaultHandle from "./DefaultHandle";

const plugin: HeaderUserMenuPlugin = {
    name: "user-menu-handle",
    type: "user-menu-handle",
    render() {
        return <DefaultHandle />;
    }
};

export default plugin;
