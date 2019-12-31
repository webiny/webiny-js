import * as React from "react";
import {
    IconButton as RIconButton,
    IconButtonProps as RmwcIconButtonProps
} from "@rmwc/icon-button";

import { FormComponentProps } from "../../types";

type Props = FormComponentProps &
    RmwcIconButtonProps & {
        // Icon you wish to have. Icon should be provided as an SvgComponent
        icon: React.ReactElement<any>;

        // Button label.
        label?: string;

        // onClick handler.
        onClick?: (event: React.MouseEvent) => void;

        // Custom CSS class.
        className?: string;
    };

export type IconButtonProps = Props;

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
