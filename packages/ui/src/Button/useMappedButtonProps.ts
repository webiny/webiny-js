import React, { useMemo } from "react";
import { ButtonProps as AdminUiButtonProps } from "@webiny/admin-ui";

interface UseButtonPropsParams {
    children?: React.ReactNode;
    label?: string;
    small?: boolean;
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

        if (params.label) {
            mappedButtonProps.text = params.label;
        }

        return mappedButtonProps;
    }, [params.small, params.children, params.label]);
};
