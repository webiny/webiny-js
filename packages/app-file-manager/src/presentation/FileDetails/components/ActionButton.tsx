import React from "react";
import { Button } from "@webiny/admin-ui";

export interface ActionButtonProps {
    label: string;
    icon: React.JSX.Element;
    onAction: () => void;
    "data-testid"?: string;
    disabled?: boolean;
    className?: string;
}

export const ActionButton = ({
    label,
    icon,
    onAction,
    disabled,
    className,
    ...props
}: ActionButtonProps) => {
    return (
        <Button
            text={label}
            icon={icon}
            onClick={onAction}
            disabled={disabled}
            data-testid={props["data-testid"]}
            containerClassName={className}
            variant={"ghost"}
            size={"sm"}
        />
    );
};
