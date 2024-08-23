import React from "react";
import {
    IconButton as BaseIconButton,
    IconButtonProps as BaseIconButtonProps
} from "@webiny/ui-new/Button";

export interface IconButtonProps extends BaseIconButtonProps {
    // @deprecated Use `text` prop instead.
    children?: React.ReactNode;
}

export const IconButton = (props: IconButtonProps) => {
    const { icon, text, children, ...rest } = props;
    return <BaseIconButton icon={icon} text={text || children} {...rest} />;
};
