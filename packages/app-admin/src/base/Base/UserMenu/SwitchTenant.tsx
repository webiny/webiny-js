import React from "react";
import { makeDecoratable } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as SwitchIcon } from "@webiny/icons/swap_horiz.svg";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";
import { useTenantContext } from "~/presentation/tenancy/useTenantContext.js";
import { useDialogs } from "~/components/Dialogs/useDialogs.js";
import { Menu } from "~/config/AdminConfig/Menu.js";

export const SwitchTenant = makeDecoratable("SwitchTenant", () => {
    const tenancy = useTenantContext();
    const dialogs = useDialogs();
    const { identity, isAuthenticated } = useAuthentication();

    if (!isAuthenticated || !identity.canSwitchTenant) {
        return null;
    }

    const showTenants = () => {
        const currentTenantId = identity.currentTenant.id;

        dialogs.showDialog({
            title: "Switch tenant",
            description: "Your account has access to these tenants. Pick the one to open.",
            acceptLabel: null,
            cancelLabel: "Cancel",
            content: (
                <div className={"flex flex-col gap-sm"} data-testid={"switch-tenant-list"}>
                    {identity.tenants.map(tenant => (
                        <Button
                            key={tenant.id}
                            variant={"tertiary"}
                            className={"w-full justify-start"}
                            text={
                                tenant.id === currentTenantId
                                    ? `${tenant.name} (current)`
                                    : tenant.name
                            }
                            disabled={tenant.id === currentTenantId}
                            onClick={() => tenancy.setTenant(tenant.id)}
                        />
                    ))}
                </div>
            )
        });
    };

    return (
        <Menu.User.Item
            icon={<Menu.User.Item.Icon element={<SwitchIcon />} label={"Switch tenant"} />}
            text={"Switch tenant"}
            onClick={showTenants}
        />
    );
});
