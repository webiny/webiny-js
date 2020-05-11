import React from "react";
import Logo from "./Logo";
import { TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { AdminHeaderLeftPlugin } from "@webiny/app-admin/types";

const plugin: AdminHeaderLeftPlugin = {
    name: "admin-header-logo",
    type: "admin-header-left",
    render() {
        return (
            <TopAppBarTitle>
                <Logo />
            </TopAppBarTitle>
        );
    }
};

export default plugin;
