import React from "react";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
import Feedback from "./Feedback";

const plugin: AdminHeaderUserMenuPlugin = {
    name: "admin-user-menu-send-feedback",
    type: "admin-header-user-menu",
    render() {
        return <Feedback />;
    }
};

export default plugin;
