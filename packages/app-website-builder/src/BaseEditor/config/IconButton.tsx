import React from "react";
import { IconButton as AdminUiIconButton, Tooltip } from "@webiny/admin-ui";

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
            trigger={<AdminUiIconButton icon={icon} onClick={onClick} disabled={disabled} />}
        />
    );
};
