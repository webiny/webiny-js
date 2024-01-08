import React, { HTMLAttributeAnchorTarget } from "react";
import { Icon } from "@webiny/ui/Icon";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem } from "@webiny/ui/Menu";
import { Link } from "@webiny/react-router";

export interface OptionsMenuLinkProps {
    disabled?: boolean;
    icon: React.ReactElement;
    label: string;
    to: string;
    target?: HTMLAttributeAnchorTarget;
    ["data-testid"]?: string;
}

const MenuLinkItem = (props: Omit<OptionsMenuLinkProps, "to" | "target">) => {
    return (
        <MenuItem disabled={props.disabled ?? false} data-testid={props["data-testid"]}>
            <ListItemGraphic>
                <Icon icon={props.icon} />
            </ListItemGraphic>
            {props.label}
        </MenuItem>
    );
};

export const OptionsMenuLink = (props: OptionsMenuLinkProps) => {
    if (props.disabled) {
        return (
            <MenuLinkItem
                icon={props.icon}
                label={props.label}
                disabled={props.disabled}
                data-testid={props["data-testid"]}
            />
        );
    }

    return (
        <Link to={props.to} target={props.target}>
            <MenuLinkItem
                icon={props.icon}
                label={props.label}
                data-testid={props["data-testid"]}
            />
        </Link>
    );
};
