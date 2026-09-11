import * as React from "react";
import { ReactComponent as Check } from "@webiny/icons/check.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

type SelectItemProps = SelectPrimitives.SelectItemProps;

const SelectItem = ({ className, children, ...props }: SelectPrimitives.SelectItemProps) => (
    <SelectPrimitives.Item
        className={cn(
            [
                "flex items-center justify-between gap-sm-extra cursor-default select-none rounded-sm p-sm mx-sm text-md outline-none",
                "bg-neutral-elevated text-neutral-primary fill-neutral-xstrong",
                "focus:bg-neutral-dimmed",
                "data-disabled:text-neutral-disabled data-disabled:cursor-not-allowed",
                "data-[state=checked]:font-semibold"
            ],
            className
        )}
        {...props}
    >
        <SelectPrimitives.ItemText>{children}</SelectPrimitives.ItemText>
        <SelectPrimitives.ItemIndicator>
            <Check className="h-md w-h-md" />
        </SelectPrimitives.ItemIndicator>
    </SelectPrimitives.Item>
);

export { SelectItem, type SelectItemProps };
