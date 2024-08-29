import React, { useMemo } from "react";
import { ButtonProps as AdminUiButtonProps } from "@webiny/admin-ui";

interface UseButtonPropsParams {
    small?: boolean;
    children?: React.ReactNode;
}

export const useMappedButtonProps = (params: UseButtonPropsParams) => {
    return useMemo(() => {
        const mappedButtonProps: Pick<AdminUiButtonProps, "size" | "text"> = {};
        if (params.small === true) {
            mappedButtonProps.size = "sm";
        }

        if (params.children) {
            mappedButtonProps.text = params.children;
        }

        return mappedButtonProps;
    }, [params.small, params.children]);
};
