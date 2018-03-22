import React from "react";
import { createComponent, i18n } from "webiny-client";

/**
 * @i18n.namespace Webiny.Skeleton.Layout.UserMenu.AccountPreferencesMenu
 */
const AccountPreferencesMenu = props => {
    const { Link } = props;
    return (
        <user-menu-item>
            <Link route="Me.Account">{i18n("Account preferences")}</Link>
            <span>{i18n("Set your account and user preferences")}</span>
        </user-menu-item>
    );
};

export default createComponent(AccountPreferencesMenu, { modules: ["Link"] });
