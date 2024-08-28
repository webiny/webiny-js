import React from "react";
import {
    IconButton as BaseIconButton,
    IconButtonProps as BaseIconButtonProps
} from "@webiny/admin-ui/Button";

export interface IconButtonProps extends BaseIconButtonProps {
    /**
     * @deprecated Use `text` prop instead.
     */
    label?: string;

    /**
     * @deprecated Use `size` prop instead.
     */
    small?: boolean;
}

export const IconButton = (props: IconButtonProps) => {
    const { icon, text, label, children, ...rest } = props;
    return <BaseIconButton icon={icon} text={text || label || children} {...rest} />;
};
