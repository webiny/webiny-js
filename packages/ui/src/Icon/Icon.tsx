import * as React from "react";
import { css } from "emotion";
import classNames from "classnames";

export type IconProps = {
    /**
     * SvgComponent containing the svg icon
     */
    icon: React.ReactElement<any>;

    /**
     * Optional onclick handler
     */
    onClick?: Function;

    /**
     * CSS class to be added to the icon
     */
    className?: string;

    // For testing purposes.
    "data-testid"?: string;
};

const webinyIcon = css(
    {},
    {
        "&.mdc-button__icon": {
            marginLeft: 0,
            width: "inherit",
            display: "block"
        }
    }
);

/**
 * Use Icon component to display an icon.
 * @param props
 * @returns {*}
 * @constructor
 */
const Icon = (props: IconProps) => {
    return React.cloneElement(props.icon, {
        "data-testid": props["data-testid"],
        className: classNames("mdc-button__icon webiny-ui-icon", webinyIcon, props.className),
        onClick: props.onClick
    });
};

export { Icon };
