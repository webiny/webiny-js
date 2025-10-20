import * as React from "react";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

type SelectScrollDownButtonProps = SelectPrimitives.SelectScrollDownButtonProps;

const SelectScrollDownButton = ({ className, ...props }: SelectScrollDownButtonProps) => (
    <SelectPrimitives.ScrollDownButton
        className={cn(
            "flex cursor-default items-center justify-center pt-sm fill-neutral-xstrong",
            className
        )}
        {...props}
    >
        <ChevronDown className="h-md w-md" />
    </SelectPrimitives.ScrollDownButton>
);

export { SelectScrollDownButton, type SelectScrollDownButtonProps };
