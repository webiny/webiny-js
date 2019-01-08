// @flow
import * as React from "react";
import { router } from "webiny-app/router";
import _ from "lodash";
import type { Route } from "webiny-react-router/types";
import { Link } from "webiny-app/router";

const utils = {
    /**
     * Traverse all menus and try to match a menu which points to the given route.
     * Return top level menu.
     */
    findMenuByRoute(menus: Array<Object>, route: Route) {
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

    getLink(route: string, LinkComponent: typeof Link, linkProps: Object = {}) {
        if (router.getRoute(route)) {
            linkProps.route = route;
        } else {
            linkProps.url = route;
        }

        if (!linkProps.children) {
            linkProps.children = linkProps.label;
        }

        return <LinkComponent {...linkProps} />;
    },

    canAccess(/*menu*/) {
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
