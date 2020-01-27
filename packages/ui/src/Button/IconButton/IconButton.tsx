import * as React from "react";
import {
    IconButton as RIconButton,
    IconButtonProps as RmwcIconButtonProps
} from "@rmwc/icon-button";

import { FormComponentProps } from "../../types";

export type IconButtonProps = FormComponentProps &
    RmwcIconButtonProps & {
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
    };

/**
 * Shows the icon button.
 * @param props
 * @returns {*}
 * @constructor
 */
const IconButton = (props: IconButtonProps) => {
    const { icon, label, onClick, className, disabled, ripple = true } = props;

    return (
        <RIconButton
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
