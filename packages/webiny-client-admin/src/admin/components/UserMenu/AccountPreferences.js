import React from "react";
import { Component, i18n } from "webiny-client";

const t = i18n.namespace("Webiny.Admin.Layout.UserMenu.AccountPreferencesMenu");

const AccountPreferencesMenu = props => {
    const { Link } = props.modules;
    return (
        <user-menu-item>
            <Link route="Me.Account">{t`Account preferences`}</Link>
            <span>{t`Set your account and user preferences`}</span>
        </user-menu-item>
    );
};

export default Component({ modules: ["Link"] })(AccountPreferencesMenu);
