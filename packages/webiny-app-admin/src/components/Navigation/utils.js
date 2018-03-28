import React from 'react';
import { app } from 'webiny-app';
import _ from 'lodash';

const utils = {
    /**
     * Traverse all menus and try to match a menu which points to the given route.
     * Return top level menu.
     */
    findMenuByRoute(menus, route) {
        let found = null;
        _.each(menus, menu => {
            const children = React.Children.toArray(menu.props.children);
            if (children.length) {
                if (utils.findMenuByRoute(children, route)) {
                    found = menu;
                    return false;
                }
            } else if (menu.props.route === route.name) {
                found = menu;
                return false;
            }
        });
        return found;
    },

    /**
     * Find menu by route and return menu id or default value.
     */
    checkRoute(route, defaultValue = null) {
        // Check if current route has an associated menu item
        const routeMenu = utils.findMenuByRoute(app.services.get('menu').getMenu(), route);
        if (routeMenu) {
            return routeMenu.props.id || routeMenu.props.label;
        }
        return defaultValue;
    },

    findRoute(props, routeName) {
        const children = React.Children.toArray(props.children);
        if (children.length) {
            let active = false;
            _.each(children, child => {
                if (utils.findRoute(child.props, routeName)) {
                    active = true;
                    return false;
                }
            });
            return active;
        }

        return props.route === routeName;
    },

    getLink(route, Link, linkProps = {}) {
        route = _.isString(route) ? route : null;

        if (app.router.getRoute(route)) {
            linkProps.route = route;
        } else {
            linkProps.url = route;
        }

        if (!linkProps.children) {
            linkProps.children = linkProps.label;
        }

        return <Link {...linkProps}/>;
    },

    canAccess(menu) {
        return true;
        // TODO:
        /*if (!menu.role || !menu.role.length) {
            return true;
        }

        const user = Webiny.Model.get('User');
        const roles = _.isArray(menu.role) ? menu.role : menu.role.split(',');
        if (!user || !Webiny.Auth.hasRole(roles)) {
            return false;
        }
        return true;*/
    }
};

export default utils;

