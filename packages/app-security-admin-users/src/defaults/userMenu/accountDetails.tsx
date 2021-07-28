import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Link } from "@webiny/react-router";
import { AdminViewPlugin } from "@webiny/app-admin/plugins/AdminViewPlugin";
import { UserMenuElement } from "@webiny/app-admin/elements/UserMenuElement";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
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
    return new AdminViewPlugin(view => {
        const userMenu = view.getElement<UserMenuElement>("userMenu");

        userMenu.addElement(new GenericElement("accountDetails", () => <AccountDetails />));
    });
};
