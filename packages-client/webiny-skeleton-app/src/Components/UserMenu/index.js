import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class UserMenu extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: {}
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.watch('User', user => {
            this.setState({user});
        });
    }

    getUserName() {
        const user = this.state.user;
        if (_.get(user, 'firstName', '') === '' && _.get(user, 'lastName', '') === '') {
            return _.get(user, 'email', '');
        }

        return _.get(user, 'firstName', '') + ' ' + _.get(user, 'lastName', '');
    }

    renderLogoutMenuItem() {
        const item = this.props.logoutMenuItem;
        if (!item) {
            return null;
        }

        const logout = {logout: () => Webiny.Auth.logout()};
        return React.isValidElement(item) ? React.cloneElement(item, logout) : React.createElement(item, logout);
    }
}

UserMenu.defaultProps = {
    renderer() {
        if (!this.state.user) {
            return null;
        }

        return (
            <div className="dropdown profile-holder">
                <a href="#" className="profile" data-toggle="dropdown">
                    <span className="icon-user icon"/>
                    <span className="user">{this.getUserName()}</span>
                </a>

                <div className="drop dropdown-menu" role="menu">
                    <span className="top-arr"/>
                    <ul>
                        {this.props.userMenuItems.map((item, i) => (
                            <li key={i}>
                                {React.isValidElement(item) ? item : React.createElement(item)}
                            </li>
                        ))}
                    </ul>
                    {this.renderLogoutMenuItem()}
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(UserMenu, {
    modules: [{
        userMenuItems: () => {
            return Webiny.importByTag('user-menu-item').then(modules => {
                return Object.values(modules).filter(m => !_.isNil(m));
            });
        },
        logoutMenuItem: 'Webiny/Skeleton/UserMenu/Logout'
    }]
});