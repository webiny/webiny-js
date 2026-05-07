import React from "react";
import { IconButton, Tooltip } from "@webiny/admin-ui";

export interface IconButtonProps {
    icon: React.JSX.Element;
    label: string;
    disabled?: boolean;
    onClick?: () => void;
}

export const IconButton = ({ label, icon, disabled = false, onClick }: IconButtonProps) => {
    return (
        <Tooltip
            side={"bottom"}
            content={label}
            trigger={<IconButton icon={icon} onClick={onClick} disabled={disabled} />}
        />
    );
};
