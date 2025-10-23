import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";
import { SelectScrollUpButton } from "./SelectScrollUpButton.js";
import { SelectScrollDownButton } from "./SelectScrollDownButton.js";

type SelectContentProps = SelectPrimitives.SelectContentProps;

const SelectContent = ({ className, children, ...props }: SelectContentProps) => (
    <SelectPrimitives.Portal>
        <SelectPrimitives.Content
            className={cn(
                [
                    "relative z-150 max-h-96 min-w-56 shadow-lg py-sm overflow-hidden rounded-sm border-sm border-neutral-muted bg-neutral-base text-neutral-strong",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
                ],
                className
            )}
            position={"popper"}
            {...props}
        >
            <SelectScrollUpButton />
            <SelectPrimitives.Viewport
                className={cn([
                    "py-xs",
                    "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"
                ])}
            >
                {children}
            </SelectPrimitives.Viewport>
            <SelectScrollDownButton />
        </SelectPrimitives.Content>
    </SelectPrimitives.Portal>
);

export { SelectContent, type SelectContentProps };
