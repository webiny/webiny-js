import React from "react";
import Logo from "./Logo";
import { TopAppBarTitle } from "@webiny/ui/TopAppBar";
import { AdminHeaderLeftPlugin, AdminMenuLogoPlugin } from "@webiny/app-admin/types";

export default [
    {
        name: "admin-header-logo",
        type: "admin-header-left",
        render() {
            return (
                <TopAppBarTitle>
                    <Logo white />
                </TopAppBarTitle>
            );
        }
    } as AdminHeaderLeftPlugin,
    {
        name: "admin-menu-logo",
        type: "admin-menu-logo",
        render() {
            return (
                <TopAppBarTitle>
                    <Logo />
                </TopAppBarTitle>
            );
        }
    } as AdminMenuLogoPlugin
];
