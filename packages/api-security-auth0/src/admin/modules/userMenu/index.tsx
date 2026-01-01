import React, { Fragment } from "react";
import { AdminConfig } from "@webiny/app-serverless-cms";
import { UserInfo } from "./UserInfo.js";
import { SignOut } from "./SignOut.js";
import { UserMenuHandle } from "./UserMenuHandle.js";
import { ExitTenant } from "./ExitTenant.js";

const { Menu } = AdminConfig;

export const UserMenuModule = () => {
    return (
        <Fragment>
            <UserMenuHandle />
            <AdminConfig>
                <Menu.User name={"exitTenant"} element={<ExitTenant />} />
                <Menu.User name={"signOut"} element={<SignOut />} />
                <Menu.User name={"userInfo"} element={<UserInfo />} />
            </AdminConfig>
        </Fragment>
    );
};
