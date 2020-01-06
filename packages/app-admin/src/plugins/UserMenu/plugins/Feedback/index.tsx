import React from "react";
import { HeaderUserMenuPlugin } from "@webiny/app-admin/types";
import Feedback from "./Feedback";

const plugin: HeaderUserMenuPlugin = {
    name: "user-menu-send-feedback",
    type: "header-user-menu",
    render() {
        return <Feedback />;
    }
};

export default plugin;
