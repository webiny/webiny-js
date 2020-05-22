import React from "react";
import Hamburger from "./Hamburger";
import { AdminHeaderLeftPlugin } from "@webiny/app-admin/types";

const plugin: AdminHeaderLeftPlugin = {
    name: "admin-header-main-menu-icon",
    type: "admin-header-left",
    render() {
        return <Hamburger />;
    }
};

export default plugin;
