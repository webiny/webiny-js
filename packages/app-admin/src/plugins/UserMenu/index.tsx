import React from "react";
import { HeaderRightPlugin } from "@webiny/app-admin/types";
import UserMenu from "./UserMenu";

const plugin: HeaderRightPlugin = {
    name: "header-user-menu",
    type: "header-right",
    render() {
        return <UserMenu />;
    }
};

export default plugin;
