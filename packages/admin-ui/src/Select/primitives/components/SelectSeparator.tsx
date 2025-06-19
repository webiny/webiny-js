import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils";

type SelectSeparatorProps = SelectPrimitives.SelectSeparatorProps;

const SelectSeparator = ({ className, ...props }: SelectSeparatorProps) => (
    <SelectPrimitives.Separator
        className={cn("wby--mx-sm wby-my-sm wby-h-px wby-bg-neutral-strong", className)}
        {...props}
    />
);
export { SelectSeparator, type SelectSeparatorProps };
