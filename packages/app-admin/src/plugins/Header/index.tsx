import React from "react";
import { AdminLayoutComponentPlugin } from "@webiny/app-admin/types";
import Header from "./Header";

const plugin: AdminLayoutComponentPlugin = {
    name: "admin-layout-component-header",
    type: "admin-layout-component",
    render() {
        return <Header />;
    }
};

export default plugin;
