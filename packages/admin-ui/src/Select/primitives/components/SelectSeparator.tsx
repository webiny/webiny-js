import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

type SelectSeparatorProps = SelectPrimitives.SelectSeparatorProps;

const SelectSeparator = ({ className, ...props }: SelectSeparatorProps) => (
    <SelectPrimitives.Separator
        className={cn("-mx-sm my-sm h-px bg-neutral-strong", className)}
        {...props}
    />
);
export { SelectSeparator, type SelectSeparatorProps };
