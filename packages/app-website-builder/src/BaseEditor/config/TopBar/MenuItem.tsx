import React from "react";
import { DropdownMenu, Icon } from "@webiny/admin-ui";

export interface MenuItemProps {
    label: string;
    onClick: () => void;
    icon: React.JSX.Element;
    "data-testid"?: string;
    disabled?: boolean;
}

export const MenuItem = (props: MenuItemProps) => {
    return (
        <DropdownMenu.Item
            onClick={props.onClick}
            disabled={Boolean(props.disabled)}
            data-testid={props["data-testid"]}
            icon={<Icon icon={props.icon} />}
            text={props.label}
        />
    );
};
