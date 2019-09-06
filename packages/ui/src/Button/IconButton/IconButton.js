// @flow
import * as React from "react";
import { IconButton as RIconButton } from "@rmwc/icon-button";

import type { FormComponentProps } from "../../types";

type Props = FormComponentProps & {
    // Icon you wish to have. Icon should be provided as an SvgComponent
    icon: React.Element<any>,

    // Button label.
    label?: string,

    // onClick handler.
    onClick?: Function,

    // Custom CSS class.
    className?: string,

    // Should icon be disabled?
    disabled?: boolean
};

/**
 * Shows the icon button.
 * @param props
 * @returns {*}
 * @constructor
 */
const IconButton = (props: Props) => {
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
