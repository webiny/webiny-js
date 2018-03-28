"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _sortBy2 = require("lodash/sortBy");

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Menu = require("./../components/Menu");

var _Menu2 = _interopRequireDefault(_Menu);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function findMenuIndex(findIn, menu) {
    return (0, _findIndex3.default)(findIn, function(item) {
        var id = item.props.id || item.props.label;
        var menuId = menu.props.id || menu.props.label;
        return id === menuId;
    });
}

function mergeMenus(menu1, menu2) {
    // If requested, overwrite existing menu and exit
    if (menu2.props.overwriteExisting) {
        return menu2;
    }

    var omit = ["render", "children"];

    // Create merged props object
    var newProps = (0, _merge3.default)(
        {},
        (0, _omit3.default)(menu1.props, omit),
        (0, _omit3.default)(menu2.props, omit)
    );
    var newChildren = _react2.default.Children.toArray(menu1.props.children);
    newProps.key = menu1.props.id || menu1.props.label;
    _react2.default.Children.forEach(menu2.props.children, function(child) {
        var existingMenu = findMenuIndex(newChildren, child);
        if (existingMenu > -1) {
            newChildren[existingMenu] = mergeMenus(newChildren[existingMenu], child);
        } else {
            newChildren.push(
                _react2.default.cloneElement(child, { key: child.props.id || child.props.label })
            );
        }
    });

    return _react2.default.createElement(_Menu2.default, newProps, newChildren);
}

function sortMenus(menus) {
    var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    menus = (0, _sortBy3.default)(menus, ["props.order", "props.label"]);
    return menus.map(function(menu) {
        return _react2.default.cloneElement(
            menu,
            (0, _assign3.default)({}, menu.props, { level: level }),
            sortMenus(_react2.default.Children.toArray(menu.props.children), level + 1)
        );
    });
}

/**
 * Menu class holds the entire system menu structure.
 * Menu items are registered when app modules are initiated.
 */

var Menu = (function() {
    function Menu() {
        (0, _classCallCheck3.default)(this, Menu);

        this.menu = [];
    }

    /**
     * Add a single top-level menu to system menu
     * @param menu
     */

    (0, _createClass3.default)(Menu, [
        {
            key: "add",
            value: function add(menu) {
                // Make sure we have a menu ID
                menu = _react2.default.cloneElement(menu, {
                    id: menu.props.id || menu.props.label
                });

                // If top-level menu already exists...
                var menuIndex = findMenuIndex(this.menu, menu);
                if (menuIndex > -1) {
                    // Merge new menu with existing menu
                    var existingMenu = this.menu[menuIndex];
                    this.menu[menuIndex] = mergeMenus(existingMenu, menu);
                } else {
                    // New top-level menu
                    this.menu.push(menu);
                }

                // Sort menu by order, then by label (alphabetically)
                this.menu = sortMenus(this.menu);

                return this;
            }

            /**
             * Get entire system menu
             * @returns {{}|*}
             */
        },
        {
            key: "getMenu",
            value: function getMenu() {
                return this.menu;
            }
        }
    ]);
    return Menu;
})();

exports.default = Menu;
//# sourceMappingURL=menu.js.map
