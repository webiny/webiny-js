import React from "react";
import * as RmwcButton from "@rmwc/button";
import { Fab, FabProps } from "@rmwc/fab";
import { Icon, IconProps } from "../Icon/Icon";
import classNames from "classnames";
import { SyntheticEvent } from "react";
import { webinyButtonStyles } from "./Button.styles";

export interface ButtonProps {
    /**
     * Make button flat (only applicable to Primary button).
     */
    flat?: boolean;

    /**
     * Make button smaller.
     */
    small?: boolean;

    /**
     * Returning `any` allows us to pass callbacks to the button without worrying about their
     * specific return types. Buttons don't use return values from callbacks, so we don't have to worry
     * about their return types at all.
     */
    onClick?: (event: React.MouseEvent<any, MouseEvent>) => any;

    /**
     * Label and optionally an icon (using Button.Icon component).
     */
    children?: React.ReactNode;

    /**
     * Show ripple effect on button click.
     */
    ripple?: boolean;

    /**
     * Additional button class name.
     */
    className?: string;

    /**
     * Is button disabled?
     */
    disabled?: boolean;

    /**
     * Additional inline styles.
     */
    style?: { [key: string]: any };

    /**
     * ID of the element for testing purposes.
     */
    "data-testid"?: string;
}

/**
 * Shows a default button, used typically when action is not of high priority.
 */
export const ButtonDefault = (props: ButtonProps) => {
    const { disabled, onClick, children, small, ripple, className = "", style } = props;

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
export const ButtonPrimary = (props: ButtonProps) => {
    const {
        disabled,
        onClick,
        children,
        small = false,
        flat = false,
        ripple,
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
export const ButtonSecondary = (props: ButtonProps) => {
    const {
        disabled,
        onClick,
        children,
        small = false,
        ripple,
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
            className={classNames(
                "webiny-ui-button webiny-ui-button--secondary",
                webinyButtonStyles,
                className
            )}
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
export const ButtonFloating = (props: ButtonFloatingProps) => {
    const {
        disabled,
        label,
        icon,
        onClick,
        small = false,
        ripple,
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
export const ButtonIcon = (props: IconProps) => <Icon {...props} />;
