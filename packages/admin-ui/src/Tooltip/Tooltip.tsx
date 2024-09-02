import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { makeDecoratable } from "@webiny/react-composition";

import { cn } from "~/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={4}
        className={cn(
            "z-50 rounded-md bg-popover px-3 py-2 max-w-64 text-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
));

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = (props: TooltipPrimitive.TooltipArrowProps) => (
    <TooltipPrimitive.Arrow {...props} width={12} height={6} className={"fill-popover"} />
);

TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

interface TooltipProps extends Omit<TooltipPrimitive.TooltipContentProps, "content" | "children"> {
    align?: TooltipPrimitive.TooltipContentProps["align"];
    content: React.ReactNode;
    onOpenChange?: TooltipPrimitive.TooltipProps["onOpenChange"];
    showArrow?: boolean;
    side?: TooltipPrimitive.TooltipContentProps["side"];
    trigger: React.ReactNode;
}

const TooltipBase = ({
    align,
    content,
    onOpenChange,
    showArrow = true,
    side,
    trigger,
    ...props
}: TooltipProps) => {
    return (
        <TooltipRoot delayDuration={500} onOpenChange={onOpenChange}>
            <TooltipTrigger asChild>
                <span>{trigger}</span>
            </TooltipTrigger>
            <TooltipContent side={side} align={align} sideOffset={4} {...props}>
                {content}
                {showArrow && <TooltipArrow />}
            </TooltipContent>
        </TooltipRoot>
    );
};

const Tooltip = makeDecoratable("Tooltip", TooltipBase);

export { Tooltip, TooltipProvider, type TooltipProps };
