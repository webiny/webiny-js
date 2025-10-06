import React from "react";
import { makeDecoratable } from "@webiny/app-serverless-cms";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-admin";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as SignOutIcon } from "@webiny/icons/logout.svg";

const { Menu } = AdminConfig;

export const ExitTenant = makeDecoratable("ExitTenant", () => {
    const security = useSecurity();
    const tenancy = useTenancy();

    if (!security || !security.identity) {
        return null;
    }

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = security.identity;

    if (tenancy && currentTenant && defaultTenant && currentTenant.id !== defaultTenant.id) {
        return (
            <Menu.User.Item
                icon={<Menu.User.Item.Icon element={<SignOutIcon />} label={"Exit tenant"} />}
                text={"Exit tenant"}
                onClick={() => tenancy.setTenant(defaultTenant.id)}
            />
        );
    }

    return null;
});
