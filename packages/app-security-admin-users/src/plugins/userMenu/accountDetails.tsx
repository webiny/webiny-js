import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Link } from "@webiny/react-router";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";
import { UserMenuElement } from "@webiny/app-admin/plugins/userMenu/UserMenuElement";
import { ReactComponent as AccountIcon } from "../../assets/icons/round-account_circle-24px.svg";

const AccountDetails = () => {
    return (
        <Link to={"/account"}>
            <ListItem>
                <ListItemGraphic>
                    <Icon icon={<AccountIcon />} />
                </ListItemGraphic>
                Account details
            </ListItem>
        </Link>
    );
};

export default () => {
    return new UIViewPlugin<AdminView>(AdminView, view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");

        if (userMenu) {
            userMenu.addElement(new GenericElement("accountDetails", () => <AccountDetails />));
        }
    });
};
