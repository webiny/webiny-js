import React from "react";
import { Button, ButtonProps } from "./Button";

export interface IconButtonProps extends ButtonProps {
    /**
     * Icon should be provided as an SvgComponent.
     */
    icon: React.ReactNode;

    /**
     * Button label
     */
    label?: string;
}

export const IconButton = ({ icon, label, ...others }: IconButtonProps) => {
    return (
        <Button aria-label={label} {...others}>
            {icon}
        </Button>
    );
};
