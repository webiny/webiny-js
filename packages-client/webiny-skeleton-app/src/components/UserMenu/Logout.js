import React from 'react';
import { createComponent, i18n } from 'webiny-client';

/**
 * @i18n.namespace Webiny.Skeleton.Layout.UserMenu.Logout
 */
const Logout = (props) => {
    return (
        <div className="drop-footer">
            <a href="javascript:void(0);" className="logout" onClick={props.logout}>
                <span className="icon-sign-out icon-bell icon"/>
                <span>{i18n('Log out')}</span>
            </a>
        </div>
    );
};

export default createComponent(Logout);