import React from "react";
import { ButtonProps } from "./Button";
import { useMappedButtonProps } from "~/Button/useMappedButtonProps";
import { Button as AdminUiButton } from "@webiny/admin-ui";

export interface IconButtonProps extends ButtonProps {
    /**
     * Icon should be provided as an SvgComponent.
     */
    icon: React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Button` component from the `@webiny/admin-ui` package instead.
 */
export const IconButton = (props: IconButtonProps) => {
    const mappedProps = useMappedButtonProps(props);
    return <AdminUiButton {...props} {...mappedProps} variant={"primary"} />;
};
