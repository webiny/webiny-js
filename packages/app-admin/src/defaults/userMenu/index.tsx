import React from "react";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
import { Icon } from "@webiny/ui/Icon";
import { AdminViewPlugin } from "~/plugins/AdminViewPlugin";
import { UserMenuElement } from "~/elements/UserMenuElement";
import { ReactComponent as Account } from "~/assets/icons/round-account_circle-24px.svg";

export default new AdminViewPlugin(view => {
    const rightSection = view.getHeaderElement().getRightSection();

    const userMenu = rightSection.addElement(new UserMenuElement());
    userMenu.setMenuHandleElement(new GenericElement("handle", () => <Icon icon={<Account />} />));
});
