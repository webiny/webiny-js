import { Popover } from "radix-ui";
import {
    PopoverArrow,
    PopoverContent,
    type PopoverArrowProps as PopoverPrimitiveArrowProps,
    type PopoverContentProps as PopoverPrimitiveContentProps
} from "./components";
import { withStaticProps } from "~/utils";

const PopoverRoot = Popover.Root;
const PopoverAnchor = Popover.Anchor;
const PopoverTrigger = Popover.Trigger;
const PopoverClose = Popover.Close;

type PopoverPrimitiveProps = Popover.PopoverProps;

const PopoverPrimitive = withStaticProps(PopoverRoot, {
    Anchor: PopoverAnchor,
    Arrow: PopoverArrow,
    Close: PopoverClose,
    Content: PopoverContent,
    Trigger: PopoverTrigger
});

export {
    PopoverPrimitive,
    type PopoverPrimitiveProps,
    type PopoverPrimitiveArrowProps,
    type PopoverPrimitiveContentProps
};
