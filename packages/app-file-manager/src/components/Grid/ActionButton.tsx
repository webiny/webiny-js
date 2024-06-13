import React from "react";
import { IconButton } from "@webiny/ui/Button";

export interface ActionButtonProps {
    icon: JSX.Element;
    onAction: () => void;
    "data-testid"?: string;
    disabled?: boolean;
}

export const ActionButton = ({ icon, onAction, disabled, ...props }: ActionButtonProps) => {
    return (
        <IconButton
            icon={icon}
            onClick={onAction}
            disabled={disabled}
            data-testid={props["data-testid"]}
        />
    );
};
