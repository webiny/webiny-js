// @flow
import * as React from "react";
import { Link } from "react-router-dom";
import _ from "lodash";
import type { Route } from "webiny-react-router/types";

const allowedProps = [
    "className",
    "style",
    "target",
    "href",
    "onClick",
    "title",
    "tabIndex",
    "disabled"
];

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
        if (!linkProps.children) {
            linkProps.children = linkProps.label;
        }

        if (!route) {
            const finalProps = {};
            _.each(linkProps, (value, prop) => {
                if (allowedProps.includes(prop) || prop.startsWith("data-")) {
                    finalProps[prop] = value;
                }
            });

            return <a {...finalProps}>{linkProps.children}</a>;
        }

        return <LinkComponent to={route} {...linkProps} />;
    }
};

export default utils;
