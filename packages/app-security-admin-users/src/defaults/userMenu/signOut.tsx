import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { AdminView } from "@webiny/app-admin/views/AdminView";
import { UserMenuElement } from "@webiny/app-admin/defaults/userMenu/UserMenuElement";
import { ReactComponent as SignOutIcon } from "../../assets/icons/round-lock_open-24px.svg";

const SignOut = () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    if (typeof identity.logout !== "function") {
        console.warn(`Missing "logout" function implementation in SecurityIdentity!`);
        return null;
    }

    return (
        <ListItem onClick={identity.logout}>
            <ListItemGraphic>{<Icon icon={<SignOutIcon />} />}</ListItemGraphic>
            Sign out
        </ListItem>
    );
};

export default () => {
    return new UIViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");
        if (userMenu) {
            const signOut = new GenericElement("signOut", () => <SignOut />);
            signOut.moveToTheEndOf(userMenu);
        }
    });
};
