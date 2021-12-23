import React, { Fragment, useCallback } from "react";
import { css } from "emotion";
import { Transition } from "react-transition-group";
import classNames from "classnames";
import { Link } from "@webiny/react-router";
import { useMenuItem, MenuItems } from "@webiny/app-admin";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { useNavigation } from "../index";
import { ReactComponent as UpIcon } from "../icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DownIcon } from "../icons/round-keyboard_arrow_down-24px.svg";

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

const menuTitle = css({
    ".mdc-drawer &.mdc-list": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        padding: 0,
        ".mdc-list-item": {
            margin: 0,
            padding: "0 15px",
            height: "48px",
            width: "100%",
            fontWeight: 600,
            boxSizing: "border-box"
        }
    }
});

const menuTitleActive = css({
    backgroundColor: "var(--mdc-theme-background)"
});

export const MenuGroupRenderer = PrevMenuItem => {
    return function MenuGroup() {
        const [, setVisible] = useNavigation();
        const { menuItem, depth } = useMenuItem();
        const shouldRender = depth === 0 && menuItem.children;
        const isExpanded = true;

        const hideMenu = useCallback(() => setVisible(false), []);

        if (!shouldRender) {
            return <PrevMenuItem />;
        }

        if (!menuItem.children.length) {
            return null;
        }

        const withLink = content => {
            return (
                <Link
                    to={menuItem.path}
                    data-testid={menuItem.testId}
                    onClick={menuItem.onClick || hideMenu}
                >
                    {content}
                </Link>
            );
        };

        const item = (
            <List className={classNames(menuTitle, { [menuTitleActive]: isExpanded })}>
                <ListItem
                    data-testid={menuItem.testId}
                    onClick={() => {
                        // if (typeof menu.onClick === "function") {
                        //     menu.onClick(() => element.toggleElement());
                        // } else {
                        //     element.toggleElement();
                        // }
                    }}
                >
                    {menuItem.icon && (
                        <ListItemGraphic>
                            <IconButton icon={menuItem.icon} />
                        </ListItemGraphic>
                    )}

                    {menuItem.label}

                    {menuItem.children.length ? (
                        <ListItemMeta>
                            <IconButton icon={isExpanded ? <UpIcon /> : <DownIcon />} />
                        </ListItemMeta>
                    ) : null}
                </ListItem>
            </List>
        );

        return (
            <Fragment>
                {menuItem.path ? withLink(item) : item}
                {menuItem.children ? (
                    <Transition in={isExpanded} timeout={100} appear unmountOnExit>
                        {state => (
                            <div style={{ ...defaultStyle, ...transitionStyles[state] }}>
                                <MenuItems menuItems={menuItem.children} />
                            </div>
                        )}
                    </Transition>
                ) : null}
            </Fragment>
        );
    };
};
