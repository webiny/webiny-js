import * as React from "react";
import {
    PopoverPrimitive,
    type PopoverPrimitiveProps,
    type PopoverPrimitiveContentProps
} from "./primitives";
import { makeDecoratable } from "~/utils";

interface PopoverProps extends PopoverPrimitiveProps, Omit<PopoverPrimitiveProps, "children"> {
    align?: PopoverPrimitiveContentProps["align"];
    content: React.ReactNode;
    arrow?: boolean;
    close?: boolean;
    side?: PopoverPrimitiveContentProps["side"];
    trigger: React.ReactNode;
    variant?: PopoverPrimitiveContentProps["variant"];
}

const DecoratablePopover = ({
    align,
    arrow,
    close,
    content,
    side,
    trigger,
    variant,
    ...props
}: PopoverProps) => (
    <PopoverPrimitive {...props}>
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
        <PopoverPrimitive.Content
            align={align}
            className={"wby-px-sm-extra wby-py-sm"}
            arrow={arrow}
            side={side}
            variant={variant}
        >
            {content}
            {close && <PopoverPrimitive.Close />}
            {arrow && <PopoverPrimitive.Arrow variant={variant} />}
        </PopoverPrimitive.Content>
    </PopoverPrimitive>
);

const Popover = makeDecoratable("Popover", DecoratablePopover);

export { Popover, type PopoverProps };
