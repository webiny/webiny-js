// @flow
import * as React from "react";
import { IconButton as RIconButton } from "@rmwc/icon-button";
import { Icon } from "../../Icon/Icon";

import type { FormComponentProps } from "../../types";

type Props = FormComponentProps & {
    // Icon you wish to have. Icon should be provided as an SvgComponent
    icon: React.Element<any>,

    // Button label.
    label?: string,

    // onClick handler.
    onClick?: Function,

    // Custom CSS class.
    className?: string
};

/**
 * Shows the icon button.
 * @param props
 * @returns {*}
 * @constructor
 */
const IconButton = (props: Props) => {
    const { icon, label, onClick, className } = props;

    return (
        <icon-button onClick={onClick}>
            <RIconButton className={className} label={label} icon={<Icon icon={icon} />} />
        </icon-button>
    );
};

export { IconButton };
