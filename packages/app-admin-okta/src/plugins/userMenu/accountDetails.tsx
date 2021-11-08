import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";
import { UserMenuElement } from "@webiny/app-admin/plugins/userMenu/UserMenuElement";
import { ReactComponent as LogoutIcon } from "~/assets/icons/logout_black_24dp.svg";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";

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
    return new UIViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");

        if (userMenu) {
            userMenu.addElement(new GenericElement("accountDetails", () => <AccountDetails />));
        }
    });
};
