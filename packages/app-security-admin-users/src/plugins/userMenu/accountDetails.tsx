import React from "react";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Link } from "@webiny/react-router";
import { AdminHeaderUserMenuPlugin } from "@webiny/app-admin/types";
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

export default (): AdminHeaderUserMenuPlugin => {
    return {
        name: "admin-header-user-menu-account-details",
        type: "admin-header-user-menu",
        render() {
            return <AccountDetails />;
        }
    };
};
