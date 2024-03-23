import React from "react";
import { IconButton as BaseIconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";

export interface IconButtonProps {
    icon: JSX.Element;
    label: string;
    onClick?: () => void;
}

export const IconButton = ({ label, icon, onClick }: IconButtonProps) => {
    return (
        <Tooltip placement={"right"} content={label}>
            <BaseIconButton icon={icon} onClick={onClick} />
        </Tooltip>
    );
};
