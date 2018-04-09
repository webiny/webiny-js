import React from "react";
import { createComponent, i18n } from "webiny-app";

const t = i18n.namespace("Webiny.Skeleton.Layout.UserMenu.AccountPreferencesMenu");

const AccountPreferencesMenu = props => {
    const { Link } = props.modules;
    return (
        <user-menu-item>
            <Link route="Me.Account">{t`Account preferences`}</Link>
            <span>{t`Set your account and user preferences`}</span>
        </user-menu-item>
    );
};

export default createComponent(AccountPreferencesMenu, { modules: ["Link"] });
