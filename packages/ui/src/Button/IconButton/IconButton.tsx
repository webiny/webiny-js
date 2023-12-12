import React from "react";
import {
    IconButton as RIconButton,
    IconButtonProps as RmwcIconButtonProps
} from "@rmwc/icon-button";

import { FormComponentProps } from "../../types";

export interface IconButtonProps extends Omit<FormComponentProps, "onChange">, RmwcIconButtonProps {
    id?: string;
    /**
     * Icon should be provided as an SvgComponent.
     */
    icon: React.ReactNode;

    /**
     * Button label
     */
    label?: string;

    /**
     * onClick handler
     * @param event
     */
    onClick?: (event: React.MouseEvent) => void;

    /**
     * Custom CSS class
     */
    className?: string;
    /**
     * For testing purposes.
     */

    "data-testid"?: string;

    /**
     * Should icon be disabled?
     */
    disabled?: boolean;

    children?: React.ReactNode;
}

/**
 * Shows the icon button.
 */
const IconButton = (props: IconButtonProps) => {
    const { id, icon, label, onClick, className, disabled, ripple } = props;

    return (
        <RIconButton
            id={id}
            data-testid={props["data-testid"]}
            onClick={onClick}
            disabled={disabled}
            className={className}
            label={label}
            icon={icon}
            ripple={ripple}
        />
    );
};

export { IconButton };
