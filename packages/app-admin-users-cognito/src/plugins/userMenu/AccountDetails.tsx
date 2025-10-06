import React from "react";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-admin";
import { useIsDefaultTenant } from "./useIsDefaultTenant.js";
import { ReactComponent as AccountIcon } from "@webiny/icons/account_circle.svg";
import { ReactComponent as SignOutIcon } from "@webiny/icons/logout.svg";
import { AdminConfig } from "@webiny/app-admin";
const { Menu } = AdminConfig;

interface AccountDetailsProps {
    accountRoute: string;
}

export const AccountDetails = (props: AccountDetailsProps) => {
    const security = useSecurity();
    const tenancy = useTenancy();
    const isDefaultTenant = useIsDefaultTenant();

    if (!security || !security.identity) {
        return null;
    }

    // This is only applicable in multi-tenant environments
    const { defaultTenant } = security.identity;

    if (tenancy && !isDefaultTenant) {
        return (
            <Menu.User.Item
                icon={<Menu.User.Item.Icon element={<SignOutIcon />} label={"Exit tenant"} />}
                text={"Exit tenant"}
                onClick={() => tenancy.setTenant(defaultTenant.id)}
            />
        );
    }

    if (!security.identity.profile) {
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
