import * as React from "react";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils";

type SelectScrollDownButtonProps = SelectPrimitives.SelectScrollDownButtonProps;

const SelectScrollDownButton = ({ className, ...props }: SelectScrollDownButtonProps) => (
    <SelectPrimitives.ScrollDownButton
        className={cn(
            "wby-flex wby-cursor-default wby-items-center wby-justify-center wby-pt-sm wby-fill-neutral-xstrong",
            className
        )}
        {...props}
    >
        <ChevronDown className="wby-h-md wby-w-md" />
    </SelectPrimitives.ScrollDownButton>
);

export { SelectScrollDownButton, type SelectScrollDownButtonProps };
