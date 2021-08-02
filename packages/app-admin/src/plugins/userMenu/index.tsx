import React from "react";
import { GenericElement } from "~/ui/elements/GenericElement";
import { Icon } from "@webiny/ui/Icon";
import { UIViewPlugin } from "~/ui/UIView";
import { UserMenuElement } from "./UserMenuElement";
import { ReactComponent as Account } from "~/assets/icons/round-account_circle-24px.svg";
import { AdminView } from "~/ui/views/AdminView";

export default new UIViewPlugin<AdminView>(AdminView, view => {
    const rightSection = view.getHeaderElement().getRightSection();

    const userMenu = rightSection.addElement(new UserMenuElement());
    userMenu.setMenuHandleElement(new GenericElement("handle", () => <Icon icon={<Account />} />));
});
