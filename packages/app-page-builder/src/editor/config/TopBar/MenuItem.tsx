import React from "react";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem as UiMenuItem } from "@webiny/ui/Menu";

export interface MenuItemProps {
    label: string;
    onClick: () => void;
    icon: JSX.Element;
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
