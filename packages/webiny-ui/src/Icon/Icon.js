// @flow
import * as React from "react";
import { css } from "emotion";
import classNames from "classnames";

type Props = {
    // SvgComponent containing the svg icon
    icon: React.Element<any>,

    // Optional onclick handler
    onClick?: Function,

    // CSS class to be added to the icon.
    className?: string
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
const Icon = (props: Props) => {
    return React.cloneElement(props.icon, {
        className: classNames("mdc-button__icon", webinyIcon, props.className),
        onClick: props.onClick
    });
};

export { Icon };
