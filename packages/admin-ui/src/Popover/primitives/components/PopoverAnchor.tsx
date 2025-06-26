import React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

type PopoverAnchorProps = PopoverPrimitive.PopoverAnchorProps;

const PopoverAnchor = ({ ...props }: PopoverAnchorProps) => {
    return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
};

export { PopoverAnchor, type PopoverAnchorProps };
