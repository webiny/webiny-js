import React, { createElement, isValidElement } from 'react';
import $ from 'jquery';
import { createComponent } from 'webiny-client';

class Header extends React.Component {
    toggleMobile() {
        $('body').toggleClass('mobile-nav');
    }

    render() {
        const { userMenu, logo } = this.props;
        return (
            <div className="navbar navbar-inverse" role="navigation">
                <div className="navbar-header">
                    <button type="button" className="nav" onClick={this.toggleMobile}>
                        <span/><span/><span/>
                    </button>
                    {logo && (isValidElement(logo) ? logo : createElement(logo))}
                    {userMenu && (isValidElement(userMenu) ? userMenu : createElement(userMenu))}
                </div>
            </div>
        );
    }
}

export default createComponent(Header, {
    modules: [{
        userMenu: 'Skeleton.UserMenu',
        logo: 'Skeleton.Logo'
    }]
});