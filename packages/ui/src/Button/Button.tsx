import React from "react";

import { Button as ButtonBase, ButtonProps as ButtonPropsBase } from "@webiny/admin-ui/Button";

interface ButtonProps extends ButtonPropsBase {
    /**
     * @deprecated Will be removed in the future release.
     */
    flat?: boolean;

    /**
     * @deprecated Use `size` prop instead.
     */
    small?: boolean;

    /**
     * @deprecated Use `text` prop instead.
     */
    children?: React.ReactNode;

    /**
     * @deprecated Will be removed in the future release.
     */
    ripple?: boolean;
}

// We needed this default export for backwards compatibility.
const Button = (props: ButtonProps) => {
    return <ButtonBase {...props} />;
};

Button.displayName = "Button";

export { Button, ButtonProps };

// Needed for backward compatibility.
export default Button;

