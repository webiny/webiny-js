import React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils.js";
import { ReactComponent as Check } from "@webiny/icons/check.svg";

export interface DropdownMenuItemProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> {
    text?: React.ReactNode;
}

const DropdownMenuCheckboxItemBase = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    DropdownMenuItemProps
>(({ className, text, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            "group relative cursor-default select-none items-center rounded-sm px-xs-plus outline-none transition-colors",
            "[&_svg]:fill-neutral-xstrong [&_svg]:pointer-events-none [&_svg]:size-md [&_svg]:shrink-0",
            "data-[disabled]:pointer-events-none data-[disabled]:text-neutral-disabled",
            className
        )}
        checked={checked}
        {...props}
    >
        <div
            className={cn(
                "flex min-size-md px-sm py-xs-plus gap-sm-extra items-center text-md rounded-sm group-focus:bg-neutral-dimmed transition-colors",
                { "[&_svg]:fill-neutral-disabled": props.disabled }
            )}
        >
            <DropdownMenuPrimitive.ItemIndicator>
                <Check />
            </DropdownMenuPrimitive.ItemIndicator>
            {!checked && <svg aria-hidden="true" />}
            <span>{text}</span>
        </div>
    </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItemBase.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export const DropdownMenuCheckboxItem = makeDecoratable(
    "DropdownMenuCheckboxItem",
    DropdownMenuCheckboxItemBase
);
