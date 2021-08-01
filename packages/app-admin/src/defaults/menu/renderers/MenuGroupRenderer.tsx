import React, { Fragment } from "react";
import { css } from "emotion";
import { Transition } from "react-transition-group";
import classNames from "classnames";
import { UIRenderer, UIRenderParams } from "@webiny/ui-composer/UIRenderer";
import { List, ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as UpIcon } from "~/assets/icons/round-keyboard_arrow_up-24px.svg";
import { ReactComponent as DownIcon } from "~/assets/icons/round-keyboard_arrow_down-24px.svg";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ContentElement } from "~/views/NavigationView/ContentElement";
import { NavigationView } from "~/views/NavigationView";
import { Link } from "@webiny/react-router/";

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

export class MenuGroupRenderer extends UIRenderer<NavigationMenuElement> {
    canRender(element: NavigationMenuElement): boolean {
        const isInContent = Boolean(element.getParentOfType(ContentElement));
        return element.depth === 1 && isInContent && !element.config.path;
    }

    render({ element, props, next }: UIRenderParams<NavigationMenuElement>): React.ReactNode {
        const hasChildren = element.getElements().length > 0;

        if (!hasChildren) {
            return null;
        }

        const withLink = content => {
            const defaultOnClick = element.getView<NavigationView>().getNavigationHook().hideMenu;
            const onClick = element.config.onClick || defaultOnClick;

            return (
                <Link
                    to={element.config.path}
                    data-testid={element.config.testId}
                    onClick={onClick ? () => onClick(props) : null}
                >
                    {content}
                </Link>
            );
        };

        const menuItem = (
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

                    {hasChildren ? (
                        <ListItemMeta>
                            <IconButton icon={element.isExpanded ? <UpIcon /> : <DownIcon />} />
                        </ListItemMeta>
                    ) : null}
                </ListItem>
            </List>
        );

        return (
            <Fragment>
                {element.config.path ? withLink(menuItem) : menuItem}
                {hasChildren ? (
                    <Transition in={element.isExpanded} timeout={100} appear unmountOnExit>
                        {state => (
                            <div style={{ ...defaultStyle, ...transitionStyles[state] }}>
                                {next()}
                            </div>
                        )}
                    </Transition>
                ) : null}
            </Fragment>
        );
    }
}
