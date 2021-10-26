import React from "react";
import { Avatar } from "@webiny/ui/Avatar";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";
import { UserMenuElement } from "@webiny/app-admin/plugins/userMenu/UserMenuElement";

const UserImage = () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    const { displayName } = identity;

    return (
        <Avatar
            data-testid="logged-in-user-menu-avatar"
            src={null}
            alt={displayName}
            fallbackText={displayName}
        />
    );
};

export default () => {
    return new UIViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");

        if (userMenu) {
            userMenu.setMenuHandleElement(new GenericElement("handle", () => <UserImage />));
        }
    });
};
