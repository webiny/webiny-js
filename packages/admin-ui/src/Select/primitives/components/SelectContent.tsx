import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils";
import { SelectScrollUpButton } from "./SelectScrollUpButton";
import { SelectScrollDownButton } from "./SelectScrollDownButton";

type SelectContentProps = SelectPrimitives.SelectContentProps;

const SelectContent = ({ className, children, ...props }: SelectContentProps) => (
    <SelectPrimitives.Portal>
        <SelectPrimitives.Content
            className={cn(
                [
                    "wby-relative wby-z-[150] wby-max-h-96 wby-min-w-56 wby-shadow-lg wby-py-sm wby-overflow-hidden wby-rounded-sm wby-border-sm wby-border-neutral-muted wby-bg-neutral-base wby-text-neutral-strong",
                    "data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0 data-[state=closed]:wby-zoom-out-95 data-[state=open]:wby-zoom-in-95 data-[side=bottom]:wby-slide-in-from-top-2 data-[side=left]:wby-slide-in-from-right-2 data-[side=right]:wby-slide-in-from-left-2 data-[side=top]:wby-slide-in-from-bottom-2",
                    "data-[side=bottom]:wby-translate-y-1 data-[side=left]:wby--translate-x-1 data-[side=right]:wby-translate-x-1 data-[side=top]:wby--translate-y-1"
                ],
                className
            )}
            position={"popper"}
            {...props}
        >
            <SelectScrollUpButton />
            <SelectPrimitives.Viewport
                className={cn([
                    "wby-py-xs",
                    "wby-h-[var(--radix-select-trigger-height)] wby-w-full wby-min-w-[var(--radix-select-trigger-width)]"
                ])}
            >
                {children}
            </SelectPrimitives.Viewport>
            <SelectScrollDownButton />
        </SelectPrimitives.Content>
    </SelectPrimitives.Portal>
);

export { SelectContent, type SelectContentProps };
