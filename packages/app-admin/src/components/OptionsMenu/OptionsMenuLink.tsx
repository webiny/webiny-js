import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem } from "@webiny/ui/Menu";
import { Link } from "@webiny/react-router";

export interface OptionsMenuLinkProps {
    to: string;
    disabled?: boolean;
    icon: React.ReactElement;
    label: string;
    ["data-testid"]?: string;
}

export const OptionsMenuLink = (props: OptionsMenuLinkProps) => {
    return (
        <Link to={props.to}>
            <MenuItem disabled={props.disabled ?? false} data-testid={props["data-testid"]}>
                <ListItemGraphic>
                    <Icon icon={props.icon} />
                </ListItemGraphic>
                {props.label}
            </MenuItem>
        </Link>
    );
};
