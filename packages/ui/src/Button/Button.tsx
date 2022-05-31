import React from "react";
import * as RmwcButton from "@rmwc/button";
import { Fab, FabProps } from "@rmwc/fab";
import { Icon, IconProps } from "../Icon/Icon";
import classNames from "classnames";
import { SyntheticEvent } from "react";
import { webinyButtonStyles } from "./Button.styles";
export interface ButtonProps {
    // Make button flat (only applicable to Primary button).
    flat?: boolean;

    // Make button smaller.
    small?: boolean;

    // onClick handler.
    onClick?: (event: React.MouseEvent<any, MouseEvent>) => void | null;

    // Label and optionally an icon (using Button.Icon component).
    children?: React.ReactNode;

    // Show ripple effect on button click. Default: true
    ripple?: boolean;

    className?: string;

    disabled?: boolean;

    style?: { [key: string]: any };

    // For testing purposes.
    "data-testid"?: string;
}

/**
 * Shows a default button, used typically when action is not of high priority.
 */
export const ButtonDefault: React.FC<ButtonProps> = props => {
    const { disabled, onClick, children, small, ripple = true, className = "", style } = props;

    return (
        <RmwcButton.Button
            style={style}
            disabled={disabled}
            dense={small}
            onClick={onClick}
            ripple={ripple}
            className={classNames("webiny-ui-button", className)}
            data-testid={props["data-testid"]}
        >
            {children}
        </RmwcButton.Button>
    );
};

/**
 * Shows primary button, eg. for submitting forms.
 */
export const ButtonPrimary: React.FC<ButtonProps> = props => {
    const {
        disabled,
        onClick,
        children,
        small = false,
        flat = false,
        ripple = true,
        style = {},
        className = null
    } = props;
    return (
        <RmwcButton.Button
            raised={!flat}
            dense={small}
            disabled={disabled}
            unelevated={flat}
            ripple={ripple}
            onClick={onClick}
            style={style}
            className={classNames("webiny-ui-button webiny-ui-button--primary", className)}
            data-testid={props["data-testid"]}
        >
            {children}
        </RmwcButton.Button>
    );
};

/**
 * Shows a secondary button - eg. for doing a reset on a form.
 */
export const ButtonSecondary: React.FC<ButtonProps> = props => {
    const {
        disabled,
        onClick,
        children,
        small = false,
        ripple = true,
        className = null,
        style = {}
    } = props;

    return (
        <RmwcButton.Button
            disabled={disabled}
            outlined
            dense={small}
            ripple={ripple}
            onClick={onClick}
            style={style}
<<<<<<< HEAD
            className={classNames(
                "webiny-ui-button webiny-ui-button--secondary",
                webinyButtonStyles,
                className
            )}
=======
            className={classNames("webiny-ui-button webiny-ui-button--secondary", webinyButtonStyles, className)}
>>>>>>> 3561c09f5a (fix(ui): restore secondary button styles)
            data-testid={props["data-testid"]}
        >
            {children}
        </RmwcButton.Button>
    );
};

export type ButtonFloatingProps = ButtonProps &
    FabProps & {
        label?: React.ReactNode;
        icon?: React.ReactNode;
        onMouseDown?: (e: SyntheticEvent) => void;
        onMouseUp?: (e: SyntheticEvent) => void;
    };

/**
 * A floating button, shown on the side of the screen, typically used for creating new content or accessing settings.
 */
export const ButtonFloating: React.FC<ButtonFloatingProps> = props => {
    const {
        disabled,
        icon,
        onClick,
        small = false,
        label = false,
        ripple = true,
        className = null,
        ...rest
    } = props;
    return (
        <Fab
            data-testid={props["data-testid"]}
            disabled={disabled}
            mini={small}
            onClick={onClick}
            label={label}
            ripple={ripple}
            icon={icon}
            className={classNames("webiny-ui-button--floating", className)}
            {...rest}
        />
    );
};

/**
 * Shows an icon, suitable to be shown inside of a button.
 */
export const ButtonIcon: React.FC<IconProps> = props => <Icon {...props} />;
