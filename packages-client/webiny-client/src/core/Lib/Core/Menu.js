import _ from 'lodash';
import React from 'react';
import Webiny from './../../Webiny';

function findMenuIndex(findIn, menu) {
    return _.findIndex(findIn, item => {
        const id = item.props.id || item.props.label;
        const menuId = menu.props.id || menu.props.label;
        return id === menuId;
    });
}

function mergeMenus(menu1, menu2) {
    // If requested, overwrite existing menu and exit
    if (menu2.props.overwriteExisting) {
        return menu2;
    }

    const omit = ['renderer', 'children', 'apps'];

    // Create merged props object
    const newProps = _.merge({}, _.omit(menu1.props, omit), _.omit(menu2.props, omit));
    // Combine apps from 2 menus so we know what apps are related to this menu
    newProps.apps = _.uniq(menu1.props.apps.concat(menu2.props.apps));
    let newChildren = React.Children.toArray(menu1.props.children);
    newProps.key = menu1.props.id || menu1.props.label;
    React.Children.forEach(menu2.props.children, child => {
        const existingMenu = findMenuIndex(newChildren, child);
        if (existingMenu > -1) {
            newChildren[existingMenu] = mergeMenus(newChildren[existingMenu], child);
        } else {
            newChildren.push(React.cloneElement(child, {key: child.props.id || child.props.label}));
        }
    });

    return React.createElement(Webiny.Ui.Menu, newProps, newChildren);
}

function sortMenus(menus, level = 0) {
    menus = _.sortBy(menus, ['props.order', 'props.label']);
    return menus.map(menu => {
        return React.cloneElement(menu, _.assign({}, menu.props, {level}), sortMenus(React.Children.toArray(menu.props.children), level + 1));
    });
}

/**
 * Menu class holds the entire system menu structure.
 * Menu items are registered when app modules are initiated.
 */
class Menu {
    constructor() {
        this.menu = [];
    }

    /**
     * Add a single top-level menu to system menu
     * @param menu
     */
    add(menu) {
        // Make sure we have a menu ID
        menu = React.cloneElement(menu, {id: menu.props.id || menu.props.label});

        // If top-level menu already exists...
        const menuIndex = findMenuIndex(this.menu, menu);
        if (menuIndex > -1) {
            // Merge new menu with existing menu
            const existingMenu = this.menu[menuIndex];
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
    getMenu() {
        return this.menu;
    }
}

export default new Menu;