import React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils";
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
            "wby-group wby-relative wby-cursor-default wby-select-none wby-items-center wby-rounded-sm wby-px-xs-plus wby-outline-none wby-transition-colors",
            "[&_svg]:wby-fill-neutral-xstrong [&_svg]:wby-pointer-events-none [&_svg]:wby-size-md [&_svg]:wby-shrink-0",
            "data-[disabled]:wby-pointer-events-none data-[disabled]:wby-text-neutral-disabled",
            className
        )}
        checked={checked}
        {...props}
    >
        <div
            className={cn(
                "wby-flex wby-min-size-md wby-px-sm wby-py-xs-plus wby-gap-sm-extra wby-items-center wby-text-md wby-rounded-sm group-focus:wby-bg-neutral-dimmed wby-transition-colors",
                { "[&_svg]:wby-fill-neutral-disabled": props.disabled }
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
