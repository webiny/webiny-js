import React from "react";
import { IconButton as BaseIconButton } from "@webiny/ui/Button/index.js";
import { Tooltip } from "@webiny/ui/Tooltip/index.js";

export interface IconButtonProps {
    icon: React.JSX.Element;
    label: string;
    disabled?: boolean;
    onClick?: () => void;
}

export const IconButton = ({ label, icon, disabled = false, onClick }: IconButtonProps) => {
    return (
        <Tooltip placement={"bottom"} content={label}>
            <BaseIconButton icon={icon} onClick={onClick} disabled={disabled} />
        </Tooltip>
    );
};
