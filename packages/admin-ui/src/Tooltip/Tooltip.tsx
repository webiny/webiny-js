import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { withStaticProps, makeDecoratable } from "~/utils.js";
import type { TooltipContentProps } from "./components/index.js";
import { TooltipArrow, TooltipContent } from "./components/index.js";

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipProps extends Omit<TooltipPrimitive.TooltipContentProps, "content" | "children"> {
    align?: TooltipPrimitive.TooltipContentProps["align"];
    content: React.ReactNode;
    delay?: number;
    onOpenChange?: TooltipPrimitive.TooltipProps["onOpenChange"];
    showArrow?: boolean;
    side?: TooltipPrimitive.TooltipContentProps["side"];
    variant?: TooltipContentProps["variant"];
    trigger: React.ReactNode;
    rawTrigger?: boolean;
}

const DecoratableTooltip = ({
    align,
    content,
    onOpenChange,
    showArrow = true,
    side,
    variant,
    trigger,
    delay = 500,
    ...props
}: TooltipProps) => {
    return (
        <TooltipRoot delayDuration={delay} onOpenChange={onOpenChange}>
            <TooltipTrigger asChild>
                <span className={"inline-block leading-none"}>{trigger}</span>
            </TooltipTrigger>
            <TooltipContent
                side={side}
                align={align}
                sideOffset={4}
                variant={variant}
                hiddenArrow={!showArrow}
                {...props}
            >
                {content}
                {showArrow && <TooltipArrow variant={variant} />}
            </TooltipContent>
        </TooltipRoot>
    );
};

const Tooltip = withStaticProps(makeDecoratable("Tooltip", DecoratableTooltip), {
    Provider: TooltipProvider
});

export { Tooltip, type TooltipProps };
