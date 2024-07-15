import React from "react";
import { Button as AntButton, ButtonProps as AntButtonProps } from "antd";

export interface ButtonProps extends AntButtonProps {
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
}

export const Button = ({ children, ...props }: ButtonProps) => {
    return <AntButton {...props}>{children}</AntButton>;
};
