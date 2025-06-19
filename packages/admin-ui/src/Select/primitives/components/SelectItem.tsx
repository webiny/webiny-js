import * as React from "react";
import { ReactComponent as Check } from "@webiny/icons/check.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils";

type SelectItemProps = SelectPrimitives.SelectItemProps;

const SelectItem = ({ className, children, ...props }: SelectPrimitives.SelectItemProps) => (
    <SelectPrimitives.Item
        className={cn(
            [
                "wby-flex wby-items-center wby-justify-between wby-gap-sm-extra wby-cursor-default wby-select-none wby-rounded-sm wby-p-sm wby-mx-sm wby-text-md wby-outline-none",
                "wby-bg-neutral-base wby-text-neutral-primary wby-fill-neutral-xstrong",
                "focus:wby-bg-neutral-dimmed",
                "data-[disabled]:wby-text-neutral-disabled data-[disabled]:wby-cursor-not-allowed",
                "data-[state=checked]:wby-font-semibold"
            ],
            className
        )}
        {...props}
    >
        <SelectPrimitives.ItemText>{children}</SelectPrimitives.ItemText>
        <SelectPrimitives.ItemIndicator>
            <Check className="wby-h-md wby-w-h-md" />
        </SelectPrimitives.ItemIndicator>
    </SelectPrimitives.Item>
);

export { SelectItem, type SelectItemProps };
