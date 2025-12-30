import React from "react";
import { useAuthentication } from "@webiny/app-admin";
import { ReactComponent as SignOutIcon } from "@webiny/icons/logout.svg";
import { AdminConfig } from "@webiny/app-admin";

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
