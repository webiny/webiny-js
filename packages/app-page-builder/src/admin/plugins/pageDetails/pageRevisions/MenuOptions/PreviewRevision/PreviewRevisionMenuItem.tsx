import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";

export interface PreviewPageMenuItemProps {
    onClick: () => void;
    label: React.ReactNode;
    icon: React.ReactElement;
}

export const PreviewRevisionMenuItem = (props: PreviewPageMenuItemProps) => {
    return (
        <MenuItem onClick={props.onClick}>
            <ListItemGraphic>
                <Icon
                    data-testid="pb-page-details-revisions-page-options-menu-preview"
                    icon={props.icon}
                />
            </ListItemGraphic>
            {props.label}
        </MenuItem>
    );
};
