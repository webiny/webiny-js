import React from "react";

import { Button as AdminUiButton } from "@webiny/admin-ui/Button";
import { useMappedButtonProps } from "~/Button/useMappedButtonProps";

interface ButtonProps {
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
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Button` component from the `@webiny/admin-ui` package instead.
 */
const Button = (props: ButtonProps) => {
    const mappedProps = useMappedButtonProps(props);
    return <AdminUiButton {...props} {...mappedProps} />;
};

Button.displayName = "Button";

export { Button, ButtonProps };

// Needed for backward compatibility.
export default Button;
