import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

type SelectContentProps = SelectPrimitives.SelectContentProps;

const SelectContent = ({ className, children, ...props }: SelectContentProps) => (
    <SelectPrimitives.Portal>
        <SelectPrimitives.Content
            className={cn(
                [
                    "relative z-popover max-h-[250px] min-w-56 shadow-lg py-sm overflow-hidden rounded-sm border-sm border-neutral-muted bg-neutral-base text-neutral-strong",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
                ],
                className
            )}
            position={"popper"}
            {...props}
        >
            {/* No scroll buttons: the list has a scrollbar, and the buttons come and go with the
                scroll position, which changes the viewport height and with it the size of the
                thumb. */}
            <SelectPrimitives.Viewport
                className={cn([
                    "py-xs",
                    "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"
                ])}
            >
                {children}
            </SelectPrimitives.Viewport>
        </SelectPrimitives.Content>
    </SelectPrimitives.Portal>
);

export { SelectContent, type SelectContentProps };
