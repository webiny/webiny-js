import React from "react";
import { Link } from "@webiny/react-router";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { ElementRenderer, ElementRenderParams } from "@webiny/ui-composer/ElementRenderer";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { NavigationView } from "~/views/NavigationView";
import { Icon } from "@webiny/ui/Icon";
import { FooterElement } from "~/views/NavigationView/FooterElement";

export class MenuLinkRenderer extends ElementRenderer<NavigationMenuElement> {
    canRender(element: NavigationMenuElement): boolean {
        const isInFooter = Boolean(element.getParentOfType(FooterElement));
        return element.depth === 1 && isInFooter;
    }

    render({ element, props, next }: ElementRenderParams<NavigationMenuElement>): React.ReactNode {
        const defaultOnClick = element.getView<NavigationView>().getNavigationHook().hideMenu;
        const onClick = element.config.onClick || defaultOnClick;

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
    }
}
