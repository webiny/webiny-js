import * as React from "react";
import { ReactComponent as ChevronUp } from "@webiny/icons/keyboard_arrow_up.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

type SelectScrollUpButtonProps = SelectPrimitives.SelectScrollUpButtonProps;

const SelectScrollUpButton = ({ className, ...props }: SelectScrollUpButtonProps) => (
    <SelectPrimitives.ScrollUpButton
        className={cn(
            "flex cursor-default items-center justify-center pb-sm fill-neutral-xstrong",
            className
        )}
        {...props}
    >
        <ChevronUp className="h-md w-md" />
    </SelectPrimitives.ScrollUpButton>
);

export { SelectScrollUpButton, type SelectScrollUpButtonProps };
