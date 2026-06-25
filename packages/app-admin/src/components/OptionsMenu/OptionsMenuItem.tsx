import React from "react";
import { DropdownMenu } from "@webiny/admin-ui";

export interface OptionsMenuItemProps {
    onAction: () => void;
    disabled?: boolean;
    icon: React.ReactElement;
    label: string;
    variant?: "destructive";
    ["data-testid"]?: string;
    className?: string;
}

export const OptionsMenuItem = (props: OptionsMenuItemProps) => {
    return (
        <DropdownMenu.Item
            onClick={() => {
                props.onAction();
            }}
            disabled={props.disabled ?? false}
            data-testid={props["data-testid"]}
            icon={<DropdownMenu.Item.Icon label={props.label} element={props.icon} />}
            text={props.label}
            variant={props.variant}
            className={props.className}
        />
    );
};
