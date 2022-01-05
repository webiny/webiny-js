// @ts-nocheck
import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as LogoutIcon } from "~/assets/icons/logout_black_24dp.svg";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AccountDetails = () => {
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
};

export default () => {
    return { type: "dummy" };
    // return new UIViewPlugin<AdminView>(AdminView, view => {
    //     const userMenu = view.getElement<UserMenuElement>("userMenu");
    //
    //     if (userMenu) {
    //         userMenu.addElement(new GenericElement("accountDetails", () => <AccountDetails />));
    //     }
    // });
};
