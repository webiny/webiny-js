import React from "react";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { List, ListItem } from "@webiny/ui/List";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { NavigationView } from "~/ui/views/NavigationView";

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

export class MenuSectionItemRenderer extends UIRenderer<NavigationMenuElement> {
    canRender(element: NavigationMenuElement): boolean {
        return [2, 3].includes(element.depth) && Boolean(element.config.path);
    }

    render({ element, props }: UIRenderParams<NavigationMenuElement>): React.ReactNode {
        const defaultOnClick = element.getView<NavigationView>().getNavigationHook().hideMenu;
        const onClick = element.config.onClick || defaultOnClick;

        return (
            <List className={submenuList}>
                <ListItem className={submenuItems} data-testid={element.config.testId}>
                    {element.config.path ? (
                        <Link
                            className={linkStyle}
                            to={element.config.path}
                            onClick={onClick ? () => onClick(props) : null}
                        >
                            {element.config.label}
                        </Link>
                    ) : (
                        <span onClick={onClick ? () => onClick(props) : null} className={linkStyle}>
                            {element.config.label}
                        </span>
                    )}
                </ListItem>
            </List>
        );
    }
}
