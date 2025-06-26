import React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

type PopoverTriggerProps = PopoverPrimitive.PopoverTriggerProps;

const PopoverTrigger = ({ ...props }: PopoverTriggerProps) => {
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
};

export { PopoverTrigger, type PopoverTriggerProps };
