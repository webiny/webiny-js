import React, {createElement, isValidElement} from 'react';
import $ from 'jquery';
import {Webiny} from 'webiny-client';

class Header extends Webiny.Ui.Component {

    toggleMobile() {
        $('body').toggleClass('mobile-nav');
    }

    render() {
        const {userMenu, notifications, logo} = this.props;
        return (
            <div className="navbar navbar-inverse" role="navigation">
                <div className="navbar-header">
                    <button type="button" className="nav" onClick={this.toggleMobile}>
                        <span/><span/><span/>
                    </button>
                    {logo && (isValidElement(logo) ? logo : createElement(logo))}
                    {userMenu && (isValidElement(userMenu) ? userMenu : createElement(userMenu))}
                    {notifications && (isValidElement(notifications) ? notifications : createElement(notifications))}
                </div>
            </div>
        );
    }
}

export default Webiny.createComponent(Header, {
    modules: [{
        notifications: 'Webiny/Skeleton/Notifications/Widget',
        userMenu: 'Webiny/Skeleton/UserMenu',
        logo: 'Webiny/Skeleton/Logo'
    }]
});