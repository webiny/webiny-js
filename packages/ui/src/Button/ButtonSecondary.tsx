import React from "react";
import { ButtonProps } from "./Button";
import { useMappedButtonProps } from "~/Button/useMappedButtonProps";
import { Button as AdminUiButton } from "@webiny/admin-ui";

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Button` component from the `@webiny/admin-ui` package instead.
 */
export const ButtonSecondary = (props: ButtonProps) => {
    const mappedProps = useMappedButtonProps(props);
    return <AdminUiButton {...props} {...mappedProps} variant={"secondary"} />;
};
