"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var utils = {
    /**
     * Traverse all menus and try to match a menu which points to the given route.
     * Return top level menu.
     */
    findMenuByRoute: function findMenuByRoute(menus, route) {
        var found = null;
        (0, _each3.default)(menus, function(menu) {
            var children = _react2.default.Children.toArray(menu.props.children);
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
    checkRoute: function checkRoute(route) {
        var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        // Check if current route has an associated menu item
        var routeMenu = utils.findMenuByRoute(_webinyApp.app.services.get("menu").getMenu(), route);
        if (routeMenu) {
            return routeMenu.props.id || routeMenu.props.label;
        }
        return defaultValue;
    },
    findRoute: function findRoute(props, routeName) {
        var children = _react2.default.Children.toArray(props.children);
        if (children.length) {
            var active = false;
            (0, _each3.default)(children, function(child) {
                if (utils.findRoute(child.props, routeName)) {
                    active = true;
                    return false;
                }
            });
            return active;
        }

        return props.route === routeName;
    },
    getLink: function getLink(route, Link) {
        var linkProps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        route = (0, _isString3.default)(route) ? route : null;

        if (_webinyApp.app.router.getRoute(route)) {
            linkProps.route = route;
        } else {
            linkProps.url = route;
        }

        if (!linkProps.children) {
            linkProps.children = linkProps.label;
        }

        return _react2.default.createElement(Link, linkProps);
    },
    canAccess: function canAccess(menu) {
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

exports.default = utils;
//# sourceMappingURL=utils.js.map
