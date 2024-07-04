import React from "react";
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import classNames from "classnames";

export interface ButtonProps extends ChakraButtonProps {
    /**
     * Make button flat (only applicable to Primary button).
     * @deprecated
     */
    flat?: boolean;

    /**
     * Make button smaller.
     * @deprecated: use `size={"sm"}` instead
     */
    small?: boolean;

    /**
     * Show ripple effect on button click.
     * @deprecated
     */
    ripple?: boolean;

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

export const Button = ({
    children,
    small,
    size: propSize,
    disabled,
    className,
    ...others
}: ButtonProps) => {
    const size = small ? "sm" : propSize;

    return (
        <ChakraButton
            {...others}
            isDisabled={disabled}
            size={size}
            className={classNames("webiny-ui-button", className)}
        >
            {children}
        </ChakraButton>
    );
};

export const ButtonDefault = ({ children, ...others }: ButtonProps) => {
    return (
        <Button {...others} variant={"ghost"}>
            {children}
        </Button>
    );
};

export const ButtonPrimary = ({ children, className, ...others }: ButtonProps) => {
    return (
        <Button
            {...others}
            variant={"primary"}
            className={classNames("webiny-ui-button webiny-ui-button--primary", className)}
        >
            {children}
        </Button>
    );
};

export const ButtonSecondary = ({ children, className, ...others }: ButtonProps) => {
    return (
        <Button
            {...others}
            variant={"secondary"}
            className={classNames("webiny-ui-button webiny-ui-button--secondary", className)}
        >
            {children}
        </Button>
    );
};

export const ButtonOutline = ({ children, className, ...others }: ButtonProps) => {
    return (
        <Button
            {...others}
            variant={"outline"}
            className={classNames("webiny-ui-button webiny-ui-button--outline", className)}
        >
            {children}
        </Button>
    );
};
