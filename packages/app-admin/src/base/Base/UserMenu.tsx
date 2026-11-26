import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { SignOut } from "./UserMenu/SignOut.js";
import { UserInfo } from "./UserMenu/UserInfo.js";
import { Menu } from "~/config/AdminConfig/Menu.js";

// Switching tenants is in the sidebar header (TenantSelector), not here.
export const UserMenu = React.memo(() => {
    return (
        <AdminConfig>
            <Menu.User name={"userInfo"} element={<UserInfo />} />
            <Menu.User name={"signOut"} element={<SignOut />} />
        </AdminConfig>
    );
});

UserMenu.displayName = "UserMenu";
