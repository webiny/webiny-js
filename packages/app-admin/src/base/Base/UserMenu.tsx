import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { SignOut } from "./UserMenu/SignOut.js";
import { UserInfo } from "./UserMenu/UserInfo.js";
import { ExitTenant } from "./UserMenu/ExitTenant.js";
import { ThemeMenu } from "./ThemeMode/ThemeMenu.js";
import { Menu } from "~/config/AdminConfig/Menu.js";

export const UserMenu = React.memo(() => {
    return (
        <AdminConfig>
            <Menu.User name={"userInfo"} element={<UserInfo />} />
            <Menu.User name={"exitTenant"} element={<ExitTenant />} />
            <Menu.User name={"theme"} before={"signOut"} element={<ThemeMenu />} />
            <Menu.User name={"signOut"} element={<SignOut />} />
        </AdminConfig>
    );
});

UserMenu.displayName = "UserMenu";
