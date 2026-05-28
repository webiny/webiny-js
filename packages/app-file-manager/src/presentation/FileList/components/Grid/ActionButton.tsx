import React, { useCallback } from "react";
import { IconButton, Tooltip } from "@webiny/admin-ui";

export interface ActionButtonProps {
    icon: JSX.Element;
    label?: string;
    onAction: () => void;
    "data-testid"?: string;
    disabled?: boolean;
}

export const ActionButton = ({ icon, label, onAction, disabled, ...props }: ActionButtonProps) => {
    const onClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            // Prevent the click event from propagating to the grid item component.
            event.stopPropagation();
            onAction && onAction();
        },
        [onAction]
    );

    return (
        <Tooltip
            content={label ?? "Custom action"}
            trigger={
                <IconButton
                    variant={"tertiary"}
                    size={"sm"}
                    icon={icon}
                    onClick={onClick}
                    disabled={disabled}
                    data-testid={props["data-testid"]}
                />
            }
        />
    );
};
