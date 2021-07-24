import React, { Fragment } from "react";
import { css } from "emotion";
import { Transition } from "react-transition-group";
import classNames from "classnames";
import { Typography } from "@webiny/ui/Typography";
import { Link } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { ReactComponent as MenuIcon } from "~/assets/icons/baseline-menu-24px.svg";
import { NavigationMenuElementPlugin } from "~/plugins/NavigationMenuElementPlugin";
import { ReactComponent as UpIcon } from "~/assets/icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DownIcon } from "~/assets/icons/round-keyboard_arrow_down-24px.svg";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { Icon } from "@webiny/ui/Icon";
import { ContentElement } from "~/views/NavigationView/ContentElement";
import { FooterElement } from "~/views/NavigationView/FooterElement";

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
            height: "auto",
            width: "100%",
            fontWeight: 600,
            boxSizing: "border-box"
        }
    }
});

const menuTitleActive = css({
    backgroundColor: "var(--mdc-theme-background)"
});

const linkStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "100%",
    outline: "none",
    paddingLeft: 65,
    "&:hover": {
        textDecoration: "none"
    }
});

const submenuItems = css({
    ".mdc-drawer &.mdc-list-item": {
        paddingLeft: 0
    }
});

const submenuList = css({
    "&.mdc-list": {
        padding: 0
    }
});

const menuSectionTitle = css({
    marginLeft: 20,
    display: "flex",
    alignItems: "center",
    color: "var(--mdc-theme-on-surface)"
});

const iconWrapper = css({
    marginRight: 5,
    color: "var(--mdc-theme-on-surface)"
});

interface RenderMenuElement {
    (
        element: NavigationMenuElement,
        params: { props: any; superRender: (props: any) => React.ReactNode }
    ): React.ReactNode;
}

const renderMenu: RenderMenuElement = (element, { props, superRender }) => {
    return (
        <Fragment>
            <List className={classNames(menuTitle, { [menuTitleActive]: element.isExpanded })}>
                <ListItem
                    data-testid={element.config.testId}
                    onClick={() => {
                        if (typeof element.config.onClick === "function") {
                            element.config.onClick(() => element.toggleElement());
                        } else {
                            element.toggleElement();
                        }
                    }}
                >
                    {element.config.icon && (
                        <ListItemGraphic>
                            <IconButton icon={element.config.icon} />
                        </ListItemGraphic>
                    )}

                    {element.config.label}
                    <ListItemMeta>
                        <IconButton icon={element.isExpanded ? <UpIcon /> : <DownIcon />} />
                    </ListItemMeta>
                </ListItem>
            </List>
            <Transition in={element.isExpanded} timeout={100} appear unmountOnExit>
                {state => (
                    <div style={{ ...defaultStyle, ...transitionStyles[state] }}>
                        {superRender(props)}
                    </div>
                )}
            </Transition>
        </Fragment>
    );
};

const renderSection: RenderMenuElement = (element, { props, superRender }) => {
    return (
        <Fragment>
            <div className={menuSectionTitle}>
                <div className={iconWrapper}>{element.config.icon}</div>
                <Typography use="overline">{element.config.label}</Typography>
            </div>
            {superRender(props)}
        </Fragment>
    );
};

const renderSectionItem: RenderMenuElement = element => {
    return (
        <List className={submenuList}>
            <ListItem className={submenuItems} data-testid={element.config.testId}>
                {element.config.path ? (
                    <Link
                        className={linkStyle}
                        to={element.config.path}
                        onClick={() => element.config.onClick()}
                    >
                        {element.config.label}
                    </Link>
                ) : (
                    <span onClick={() => element.config.onClick()} className={linkStyle}>
                        {element.config.label}
                    </span>
                )}
            </ListItem>
        </List>
    );
};

const renderLink: RenderMenuElement = (element, { props }) => {
    const onClick = element.config.onClick;
    return (
        <Link
            to={element.config.path}
            data-testid={element.config.testId}
            onClick={onClick ? () => onClick(props) : null}
        >
            <ListItem ripple={false}>
                {element.config.icon ? (
                    <ListItemGraphic>
                        <Icon icon={element.config.icon} />
                    </ListItemGraphic>
                ) : null}
                {element.config.label}
            </ListItem>
        </Link>
    );
};

export default [
    new NavigationViewPlugin(view => {
        view.getHeaderElement().setMenuButton(
            <IconButton icon={<MenuIcon />} onClick={() => view.getNavigationHook().hideMenu()} />
        );
    }),
    new NavigationMenuElementPlugin(element => {
        element.setRenderer(props => {
            const depth = element.depth;
            const isContent = Boolean(element.getParentOfType(ContentElement));
            const isFooter = Boolean(element.getParentOfType(FooterElement));

            switch (true) {
                case depth === 1 && isContent:
                    return renderMenu(element, props);
                case depth === 1 && isFooter:
                    return renderLink(element, props);
                case depth === 2:
                    return renderSection(element, props);
                case depth === 3:
                    return renderSectionItem(element, props);
            }
        });
    })
];
