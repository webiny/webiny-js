import React from "react";
import { ReactComponent as SignOutIcon } from "@webiny/icons/logout.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";

const { Menu } = AdminConfig;

export const SignOut = () => {
    const { logout } = useAuthentication();

    return (
        <Menu.User.Item
            text={"Sign out"}
            icon={<Menu.User.Item.Icon element={<SignOutIcon />} label={"Sign out"} />}
            onClick={logout}
        />
    );
};
