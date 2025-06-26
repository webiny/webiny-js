import {
    PopoverAnchor,
    PopoverArrow,
    PopoverContent,
    PopoverClose,
    PopoverRoot,
    PopoverTrigger,
    type PopoverAnchorProps as PopoverPrimitiveAnchorProps,
    type PopoverArrowProps as PopoverPrimitiveArrowProps,
    type PopoverCloseProps as PopoverPrimitiveCloseProps,
    type PopoverContentProps as PopoverPrimitiveContentProps,
    type PopoverRootProps as PopoverPrimitiveProps,
    type PopoverTriggerProps as PopoverPrimitiveTriggerProps
} from "./components";
import { withStaticProps } from "~/utils";

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
    type PopoverPrimitiveAnchorProps,
    type PopoverPrimitiveArrowProps,
    type PopoverPrimitiveCloseProps,
    type PopoverPrimitiveContentProps,
    type PopoverPrimitiveTriggerProps
};
