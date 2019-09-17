// @flow
import * as React from "react";
import { Link } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import _ from "lodash";
import { getPlugin, getPlugins } from "@webiny/plugins";
import { withUi } from "@webiny/app/components";
import { Typography } from "@webiny/ui/Typography";
import { Transition } from "react-transition-group";
import Menu from "./Menu";
import handlers from "./handlers";
import utils from "./utils";
import {
    linkStyle,
    logoStyle,
    MenuFooter,
    MenuHeader,
    menuSubtitle,
    menuTitle,
    navContent,
    navHeader,
    subFooter,
    submenuItems,
    submenuList
} from "./Styled";

import { ReactComponent as MenuIcon } from "@webiny/app-admin/assets/icons/baseline-menu-24px.svg";
import { ReactComponent as DownIcon } from "@webiny/app-admin/assets/icons/round-keyboard_arrow_down-24px.svg";
import { ReactComponent as UpIcon } from "@webiny/app-admin/assets/icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DocsIcon } from "@webiny/app-admin/assets/icons/icon-documentation.svg";
import { ReactComponent as CommunityIcon } from "@webiny/app-admin/assets/icons/icon-community.svg";
import { ReactComponent as GithubIcon } from "@webiny/app-admin/assets/icons/github-brands.svg";

function findMenuIndex(findIn, menu) {
    return _.findIndex(findIn, item => {
        const id = item.props.id || item.props.label;
        const menuId = menu.props.id || menu.props.label;
        return id === menuId;
    });
}

function mergeMenus(menu1: React.Element<typeof Menu>, menu2: React.Element<typeof Menu>) {
    // If requested, overwrite existing menu and exit
    if (menu2.props.overwriteExisting) {
        return menu2;
    }

    const omit = ["render", "children"];

    // Create merged props object
    const newProps = _.merge({}, _.omit(menu1.props, omit), _.omit(menu2.props, omit));
    let newChildren = React.Children.toArray(menu1.props.children);
    newProps.key = menu1.props.id || menu1.props.label;
    React.Children.forEach(menu2.props.children, child => {
        const existingMenu = findMenuIndex(newChildren, child);
        if (existingMenu > -1) {
            newChildren[existingMenu] = mergeMenus(newChildren[existingMenu], child);
        } else {
            newChildren.push(
                React.cloneElement(child, { key: child.props.id || child.props.label })
            );
        }
    });

    return React.createElement(Menu, newProps, newChildren);
}

function sortMenus(menus, level = 0) {
    menus = _.sortBy(menus, ["props.order", "props.label"]);
    return menus.map(menu => {
        return React.cloneElement(
            menu,
            _.assign({}, menu.props, { level }),
            sortMenus(React.Children.toArray(menu.props.children), level + 1)
        );
    });
}

type Props = {
    initSections: Function,
    hideMenu: Function,
    hideSection: Function,
    showSection: Function,
    appsMenu: Object
};

class Navigation extends React.Component<Props> {
    menu: Array<React.Element<typeof Menu>> = [];

    componentDidMount() {
        this.props.initSections();
    }

    renderer = menu => {
/*
        withUi(),
            withProps(({ ui }) => ({
                appsMenu: ui.appsMenu || []
            })),
            withHandlers(handlers)
        */
        const props = _.clone(menu.props);
        const { appsMenu, hideMenu, showSection, hideSection } = this.props;

        const level = props.level || 1;

        const children = React.Children.toArray(props.children);
        const hasChildren = children.length > 0;

        let childMenuItems = null;
        if (hasChildren) {
            // Build array of child items and check their access roles.
            childMenuItems = children.map((child, i) => {
                return React.cloneElement(child, {
                    level: level + 1,
                    key: i,
                    render: this.renderer
                });
            });

            // If no child items are there to render - hide parent menu as well.
            if (!childMenuItems.filter(item => !_.isNil(item)).length) {
                return null;
            }
        }

        const linkProps = {
            "data-expanded": 0 | 1,
            children: React.Node,
            key: props.id,
            label: props.label,
            className: linkStyle,
            onClick: () => props.path && hideMenu()
        };

        if (level > 1) {
            if (level === 2) {
                linkProps.children = (
                    <Typography key={props.id} use="overline">
                        {props.label}
                    </Typography>
                );
                return (
                    <React.Fragment>
                        <Typography className={menuSubtitle} use="overline">
                            {props.label}
                        </Typography>
                        {hasChildren && childMenuItems}
                    </React.Fragment>
                );
            } else {
                linkProps.children = (
                    <ListItem className={submenuItems} key={props.id}>
                        {props.label}
                    </ListItem>
                );
                return (
                    <React.Fragment>
                        <List className={submenuList + " level-" + level}>
                            {utils.getLink(props.path, Link, linkProps)}
                        </List>
                        {hasChildren && childMenuItems}
                    </React.Fragment>
                );
            }
        }

        const isExpanded = _.get(appsMenu, "expandedSections", []).includes(props.id);

        linkProps.children = (
            <ListItem
                key={props.id}
                onClick={() => (isExpanded ? hideSection(props.id) : showSection(props.id))}
            >
                {level === 1 && (
                    <React.Fragment>
                        {props.icon && (
                            <ListItemGraphic>
                                <IconButton icon={props.icon} />
                            </ListItemGraphic>
                        )}

                        {props.label}
                        <ListItemMeta>
                            <IconButton icon={isExpanded ? <UpIcon /> : <DownIcon />} />
                        </ListItemMeta>
                    </React.Fragment>
                )}
            </ListItem>
        );

        linkProps["data-expanded"] = isExpanded;

        const defaultStyle = {
            transform: "translateY(-20px)",
            opacity: 0,
            transitionProperty: "transform, opacity",
            transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
            transitionDuration: "100ms",
            willChange: "opacity, transform"
        };

        const transitionStyles = {
            entering: { transform: "translateY(-20px)", opacity: 0 },
            entered: { transform: "translateY(0px)", opacity: 1 }
        };

        return (
            <React.Fragment>
                <List className={menuTitle + " level-" + level}>
                    {utils.getLink(props.path, Link, linkProps)}
                </List>
                <Transition in={isExpanded} timeout={100} appear={true} unmountOnExit={true}>
                    {state => (
                        <div style={{ ...defaultStyle, ...transitionStyles[state] }}>
                            {hasChildren && childMenuItems}
                        </div>
                    )}
                </Transition>
            </React.Fragment>
        );
    };

    addMenu = (menu: React.Element<typeof Menu>) => {
        if (!menu) {
            return this;
        }

        // Make sure we have a menu ID
        menu = React.cloneElement(menu, { id: menu.props.id || menu.props.label });

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
    };

    getMenu = (): Array<React.Element<typeof Menu>> => {
        if (this.menu.length) {
            return this.menu;
        }

        const menuPlugins = getPlugins("menu");
        menuPlugins &&
            menuPlugins.forEach(plugin => {
                this.addMenu(plugin.render({ Menu }));
            });

        return this.menu;
    };

    renderLogo = () => {
        const logoPlugin = getPlugin("header-logo");
        if (logoPlugin) {
            return React.cloneElement(logoPlugin.render(), { className: logoStyle });
        }
        return null;
    };

    render() {
        const { appsMenu, hideMenu } = this.props;

        return (
            <Drawer modal={true} open={appsMenu.show} onClose={hideMenu}>
                <DrawerHeader className={navHeader}>
                    <MenuHeader>
                        <IconButton icon={<MenuIcon />} onClick={hideMenu} />
                        {this.renderLogo()}
                    </MenuHeader>
                </DrawerHeader>
                <DrawerContent className={navContent}>
                    {this.getMenu().map(menu =>
                        React.cloneElement(menu, {
                            key: menu.props.id,
                            render: this.renderer
                        })
                    )}
                </DrawerContent>
                <MenuFooter>
                    <List nonInteractive={true}>
                        <a
                            href="https://docs.webiny.com/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <ListItem ripple={false}>
                                <ListItemGraphic>
                                    <Icon icon={<DocsIcon />} />
                                </ListItemGraphic>
                                Documentation
                            </ListItem>
                        </a>
                        <a
                            href="https://community.webiny.com/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <ListItem ripple={false}>
                                <ListItemGraphic>
                                    <Icon icon={<CommunityIcon />} />
                                </ListItemGraphic>
                                Community
                            </ListItem>
                        </a>
                        <a
                            href="https://github.com/webiny/webiny-js"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <ListItem ripple={false}>
                                <ListItemGraphic>
                                    <Icon icon={<GithubIcon />} />
                                </ListItemGraphic>
                                Source
                            </ListItem>
                        </a>
                        <ListItem ripple={false} className={subFooter}>
                            <div>
                                <a
                                    href="https://www.webiny.com/"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Webiny.com
                                </a>
                                <p>© {new Date().getFullYear()} Webiny Ltd, London, UK</p>
                            </div>
                        </ListItem>
                    </List>
                </MenuFooter>
            </Drawer>
        );
    }
}

export default Navigation;
