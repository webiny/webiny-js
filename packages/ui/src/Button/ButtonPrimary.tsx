import React from "react";
import { Button, ButtonProps } from "./Button";

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Button` component from the `@webiny/admin-ui` package instead.
 */
export const ButtonPrimary = (props: ButtonProps) => {
    return <Button {...props} variant={"primary"} />;
};
