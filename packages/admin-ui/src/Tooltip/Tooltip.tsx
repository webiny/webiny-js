import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { withStaticProps, makeDecoratable } from "~/utils";
import { TooltipArrow, TooltipContent, TooltipContentProps } from "./components";

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipProps extends Omit<TooltipPrimitive.TooltipContentProps, "content" | "children"> {
    align?: TooltipPrimitive.TooltipContentProps["align"];
    content: React.ReactNode;
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
    ...props
}: TooltipProps) => {
    return (
        <TooltipRoot delayDuration={500} onOpenChange={onOpenChange}>
            <TooltipTrigger asChild>
                <span className={"wby-inline-block wby-text-0 wby-leading-none"}>{trigger}</span>
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
