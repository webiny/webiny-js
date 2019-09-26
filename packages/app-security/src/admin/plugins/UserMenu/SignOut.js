//@flow
import React from "react";
import { ReactComponent as SignOutIcon } from "@webiny/app-security/admin/assets/icons/round-lock_open-24px.svg";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

const SignOut = () => {
    const { logout } = useSecurity();

    return (
        <ListItem onClick={logout}>
            <ListItemGraphic>{<Icon icon={<SignOutIcon />} />}</ListItemGraphic>
            Sign out
        </ListItem>
    );
};

export default SignOut;
