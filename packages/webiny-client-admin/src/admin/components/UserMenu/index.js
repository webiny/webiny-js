import React from "react";
import _ from "lodash";
import { app, createComponent } from "webiny-client";

class UserMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: {}
        };

        this.auth = app.security;
    }

    componentDidMount() {
        this.unwatch = this.auth.onIdentity(identity => {
            this.setState({ user: identity });
        });

        this.setState({ user: this.auth.identity });
    }

    componentWillUnmount() {
        this.unwatch();
    }

    getUserName() {
        const { user } = this.state;
        if (!_.get(user, "firstName") && !_.get(user, "lastName")) {
            return _.get(user, "email");
        }

        return _.get(user, "firstName", "") + " " + _.get(user, "lastName", "");
    }

    renderLogoutMenuItem() {
        const item = this.props.modules.logoutMenuItem;
        if (!item) {
            return null;
        }

        const logout = {
            logout: () => {
                this.auth.logout();
            }
        };
        return React.isValidElement(item)
            ? React.cloneElement(item, logout)
            : React.createElement(item, logout);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (!this.state.user) {
            return null;
        }

        const { userMenuItems } = this.props.modules;
        return (
            <div className="dropdown profile-holder">
                <a href="#" className="profile" data-toggle="dropdown">
                    <span className="icon-user icon" />
                    <span className="user">{this.getUserName()}</span>
                </a>

                <div className="drop dropdown-menu" role="menu">
                    <span className="top-arr" />
                    <ul>
                        {userMenuItems.map((item, i) => (
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
}

export default createComponent(UserMenu, {
    modules: [
        {
            userMenuItems: () => {
                return app.modules.loadByTag("user-menu-item").then(modules => {
                    return Object.values(modules).filter(m => !_.isNil(m));
                });
            },
            logoutMenuItem: "Admin.UserMenu.Logout"
        }
    ]
});
