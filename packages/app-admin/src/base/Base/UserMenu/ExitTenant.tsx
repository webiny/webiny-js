import React from "react";
import { makeDecoratable } from "@webiny/app";
import { ReactComponent as SignOutIcon } from "@webiny/icons/logout.svg";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";
import { useTenancy } from "~/presentation/tenancy/useTenancy.js";
import { AdminConfig } from "~/config/AdminConfig.js";

const { Menu } = AdminConfig;

export const ExitTenant = makeDecoratable("ExitTenant", () => {
    const tenancy = useTenancy();
    const { identity, isAuthenticated } = useAuthentication();

    if (!isAuthenticated) {
        return null;
    }

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = identity;

    if (currentTenant.id !== defaultTenant.id) {
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
