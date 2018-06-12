import React from "react";
import { i18n } from "webiny-client";

const t = i18n.namespace("Webiny.Admin.Layout.UserMenu.Logout");
const Logout = props => {
    return (
        <div className="drop-footer">
            <a href="javascript:void(0);" className="logout" onClick={props.logout}>
                <span className="icon-sign-out icon-bell icon" />
                <span>{t`Log out`}</span>
            </a>
        </div>
    );
};

export default Logout;
