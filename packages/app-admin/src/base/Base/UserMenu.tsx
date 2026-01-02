import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { SignOut } from "./UserMenu/SignOut.js";
import { UserInfo } from "./UserMenu/UserInfo.js";
import { ExitTenant } from "./UserMenu/ExitTenant.js";


const { Menu } = AdminConfig;

export const UserMenu = React.memo(() => {
    return (
        <AdminConfig>
            <Menu.User name={"userInfo"} element={<UserInfo />} />
            <Menu.User name={"exitTenant"} element={<ExitTenant />} />
            <Menu.User name={"signOut"} element={<SignOut />} />
        </AdminConfig>
    );
});

UserMenu.displayName = "UserMenu";
