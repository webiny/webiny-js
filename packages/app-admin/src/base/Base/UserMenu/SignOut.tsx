import React from "react";
import { ReactComponent as SignOutIcon } from "@webiny/icons/logout.svg";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";
import { Menu } from "~/config/AdminConfig/Menu.js";

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
