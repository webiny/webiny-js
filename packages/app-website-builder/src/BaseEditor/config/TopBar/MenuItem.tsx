import React from "react";
import { ListItemGraphic } from "@webiny/ui/List/index.js";
import { Icon } from "@webiny/ui/Icon/index.js";
import { MenuItem as UiMenuItem } from "@webiny/ui/Menu/index.js";

export interface MenuItemProps {
    label: string;
    onClick: () => void;
    icon: React.JSX.Element;
    "data-testid"?: string;
    disabled?: boolean;
}

export const MenuItem = (props: MenuItemProps) => {
    return (
        <UiMenuItem
            onClick={props.onClick}
            disabled={Boolean(props.disabled)}
            data-testid={props["data-testid"]}
        >
            <ListItemGraphic>
                <Icon icon={props.icon} />
            </ListItemGraphic>
            {props.label}
        </UiMenuItem>
    );
};
