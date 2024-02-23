import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { usePagesPermissions } from "~/hooks/permissions";

export interface DuplicatePageMenuItemProps {
    onClick: () => void;
    label: React.ReactNode;
    icon: React.ReactElement;
}

export const DuplicatePageMenuItem = (props: DuplicatePageMenuItemProps) => {
    const { canWrite } = usePagesPermissions();

    if (!canWrite) {
        return null;
    }

    return (
        <MenuItem onClick={props.onClick}>
            <ListItemGraphic>
                <Icon
                    data-testid="pb-page-details-header-page-options-menu-duplicate"
                    icon={props.icon}
                />
            </ListItemGraphic>
            {props.label}
        </MenuItem>
    );
};
