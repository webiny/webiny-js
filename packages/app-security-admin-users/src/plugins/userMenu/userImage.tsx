import React from "react";
import { Avatar } from "@webiny/ui/Avatar";
import { Image } from "@webiny/app/components";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { AdminView } from "@webiny/app-admin/views/AdminView";
import { UserMenuElement } from "@webiny/app-admin/plugins/userMenu/UserMenuElement";

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
    return new UIViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");

        if (userMenu) {
            userMenu.setMenuHandleElement(new GenericElement("handle", () => <UserImage />));
        }
    });
};
