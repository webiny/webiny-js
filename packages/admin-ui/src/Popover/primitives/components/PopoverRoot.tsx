import React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

type PopoverRootProps = PopoverPrimitive.PopoverProps;

const PopoverRoot = ({ ...props }: PopoverRootProps) => {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
};

export { PopoverRoot, type PopoverRootProps };
