import React from "react";
import { Avatar } from "@webiny/ui/Avatar";
import { Image } from "@webiny/app/components";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { AdminViewPlugin } from "@webiny/app-admin/plugins/AdminViewPlugin";
import { UserMenuElement } from "@webiny/app-admin/elements/UserMenuElement";
import { GenericElement } from "@webiny/ui-elements/GenericElement";

const UserImage = () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    const { fullName, avatar, gravatar } = identity;

    return (
        <Avatar
            data-testid="logged-in-user-menu-avatar"
            src={avatar ? avatar.src : gravatar}
            alt={fullName}
            fallbackText={fullName}
            renderImage={props => <Image {...props} transform={{ width: 100 }} />}
        />
    );
};

export default () => {
    return new AdminViewPlugin(view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");

        userMenu.setMenuHandleElement(new GenericElement("handle", () => <UserImage />));
    });
};
