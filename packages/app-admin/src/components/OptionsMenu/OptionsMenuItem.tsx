import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem } from "@webiny/ui/Menu";

interface OptionMenuItemProps {
    onAction: () => void;
    disabled?: boolean;
    icon: React.ReactElement;
    label: string;
    ["data-testid"]?: string;
}

export const OptionsMenuItem: React.VFC<OptionMenuItemProps> = props => {
    return (
        <MenuItem
            onClick={props.onAction}
            disabled={props.disabled ?? false}
            data-testid={props["data-testid"]}
        >
            <ListItemGraphic>
                <Icon icon={props.icon} />
            </ListItemGraphic>
            {props.label}
        </MenuItem>
    );
};
