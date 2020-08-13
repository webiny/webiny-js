import React from "react";
import {
    AdminHeaderUserMenuPlugin,
    AdminHeaderUserMenuUserInfoPlugin,
    AdminHeaderUserMenuHandlePlugin
} from "@webiny/app-admin/types";
import UserImage from "./UserImage";
import SignOut from "./SignOut";
import UserInfo from "./UserInfo";

export default [
    {
        name: "admin-header-user-menu-handle",
        type: "admin-header-user-menu-handle",
        render() {
            return <UserImage />;
        }
    } as AdminHeaderUserMenuHandlePlugin,
    {
        name: "admin-user-menu-sign-out",
        type: "admin-header-user-menu",
        render() {
            return <SignOut />;
        }
    } as AdminHeaderUserMenuPlugin,
    {
        name: "admin-header-user-menu-user-info",
        type: "admin-header-user-menu-user-info",
        render() {
            return <UserInfo />;
        }
    } as AdminHeaderUserMenuUserInfoPlugin
];
