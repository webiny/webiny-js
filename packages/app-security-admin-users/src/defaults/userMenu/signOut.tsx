import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { ReactComponent as SignOutIcon } from "../../assets/icons/round-lock_open-24px.svg";
import { UserMenuElement } from "@webiny/app-admin/elements/UserMenuElement";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { ViewPlugin } from "@webiny/ui-composer/View";
import { AdminView } from "@webiny/app-admin/views/AdminView";

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
    return new ViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");
        const signOut = new GenericElement("signOut", () => <SignOut />);
        signOut.moveToTheEndOf(userMenu);
    });
};
