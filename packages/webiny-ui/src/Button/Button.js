// @flow
import * as React from "react";
import * as R from "@rmwc/button";
import { Fab } from "@rmwc/fab";
import { Icon } from "../Icon/Icon";

type Props = {
    // Make button flat (only applicable to Primary button).
    flat?: boolean,

    // Make button smaller.
    small?: boolean,

    // onClick handler.
    onClick?: Function | null,

    // Label and optionally an icon (using Button.Icon component).
    children?: React.Node,

    // Show ripple effect on button click. Default: true
    ripple?: boolean,

    className?: string,

    disabled?: boolean,

    style?: Object
};

/**
 * Shows a default button, used typically when action is not of high priority.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ButtonDefault = (props: Props) => {
    const { disabled, onClick, children, small, ripple = true, className = "" } = props;

    return (
        <R.Button disabled={disabled} dense={small} onClick={onClick} ripple={ripple} className={className}>
            {children}
        </R.Button>
    );
};

/**
 * Shows primary button, eg. for submitting forms.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ButtonPrimary = (props: Props) => {
    const { disabled, onClick, children, small = false, flat = false, ripple = true, style = null } = props;
    return (
        <R.Button
            raised={!flat}
            dense={small}
            disabled={disabled}
            unelevated={flat}
            ripple={ripple}
            onClick={onClick}
            style={style}
        >
            {children}
        </R.Button>
    );
};

/**
 * Shows a secondary button - eg. for doing a reset on a form.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ButtonSecondary = (props: Props) => {
    const { disabled, onClick, children, small = false, ripple = true } = props;

    return (
        <R.Button disabled={disabled} outlined dense={small} ripple={ripple} onClick={onClick}>
            {children}
        </R.Button>
    );
};

type ButtonFloatingProps = Props & {
    label?: React.Node,
    icon?: React.Node
};

/**
 * A floating button, shown on the side of the screen, typically used for creating new content or accessing settings.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ButtonFloating = (props: ButtonFloatingProps) => {
    const { disabled, icon, onClick, small = false, label = false, ripple = true, ...rest } = props;
    return (
        <Fab disabled={disabled} mini={small} onClick={onClick} label={label} ripple={ripple} icon={icon} {...rest} />
    );
};

/**
 * Shows an icon, suitable to be shown inside of a button.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ButtonIcon = (props: Object) => <Icon {...props} />;
