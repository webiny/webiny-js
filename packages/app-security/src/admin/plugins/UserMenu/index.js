// @flow
import React from "react";
import UserImage from "./UserImage";
import SignOut from "./SignOut";
import UserInfo from "./UserInfo";

export default [
    {
        name: "user-menu-handle",
        type: "header-user-menu-handle",
        render() {
            return <UserImage />;
        }
    },
    {
        name: "user-menu-sign-out",
        type: "header-user-menu",
        render() {
            return <SignOut />;
        }
    },
    {
        name: "header-user-menu-user-info",
        type: "header-user-menu-user-info",
        render() {
            return <UserInfo />;
        }
    }
];
