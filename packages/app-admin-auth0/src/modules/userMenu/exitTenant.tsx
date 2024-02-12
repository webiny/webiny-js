import React from "react";
import { makeDecoratable } from "@webiny/app-serverless-cms";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as LogoutIcon } from "~/assets/icons/logout_black_24dp.svg";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";

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
            <ListItem onClick={() => tenancy.setTenant(defaultTenant.id)}>
                <ListItemGraphic>
                    <Icon icon={<LogoutIcon />} />
                </ListItemGraphic>
                Exit tenant
            </ListItem>
        );
    }

    return null;
});
