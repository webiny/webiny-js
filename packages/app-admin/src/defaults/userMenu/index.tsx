import React from "react";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { Icon } from "@webiny/ui/Icon";
import { UserMenuElement } from "~/elements/UserMenuElement";
import { ReactComponent as Account } from "~/assets/icons/round-account_circle-24px.svg";
import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { AdminView } from "~/views/AdminView";

export default new UIViewPlugin<AdminView>(AdminView, view => {
    const rightSection = view.getHeaderElement().getRightSection();

    const userMenu = rightSection.addElement(new UserMenuElement());
    userMenu.setMenuHandleElement(new GenericElement("handle", () => <Icon icon={<Account />} />));
});
