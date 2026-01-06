import React from "react";
import { ReactComponent as AccountIcon } from "@webiny/icons/account_circle.svg";
import { AdminConfig } from "@webiny/app-admin";
import { useIsDefaultTenant } from "./useIsDefaultTenant.js";

const { Menu } = AdminConfig;

interface AccountDetailsProps {
    accountRoute: string;
}

export const AccountDetails = (props: AccountDetailsProps) => {
    const isDefaultTenant = useIsDefaultTenant();

    if (!isDefaultTenant) {
        return null;
    }
    return (
        <Menu.User.Link
            icon={<Menu.User.Item.Icon element={<AccountIcon />} label={"Account settings"} />}
            text={"Account settings"}
            to={props.accountRoute}
        />
    );
};
