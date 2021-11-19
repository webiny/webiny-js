import React from "react";
import { Link } from "@webiny/react-router";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { NavigationView } from "~/ui/views/NavigationView";
import { Icon } from "@webiny/ui/Icon";
import { FooterElement } from "~/ui/views/NavigationView/FooterElement";

export class MenuLinkRenderer extends UIRenderer<NavigationMenuElement> {
    canRender(element: NavigationMenuElement): boolean {
        const isInFooter = Boolean(element.getParentByType(FooterElement));
        return element.depth === 1 && isInFooter;
    }

    render({ element, props }: UIRenderParams<NavigationMenuElement>): React.ReactNode {
        const defaultOnClick = element.getView<NavigationView>().getNavigationHook().hideMenu;
        const onClick = element.config.onClick || defaultOnClick;

        return (
            <Link
                to={element.config.path}
                data-testid={element.config.testId}
                onClick={onClick ? () => onClick(props) : null}
                rel={element.config.rel}
                target={element.config.target}
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
    }
}
