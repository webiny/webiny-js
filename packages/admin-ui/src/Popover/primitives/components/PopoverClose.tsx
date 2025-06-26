import React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

type PopoverCloseProps = PopoverPrimitive.PopoverCloseProps;

const PopoverClose = ({ ...props }: PopoverCloseProps) => {
    return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
};

export { PopoverClose, type PopoverCloseProps };
