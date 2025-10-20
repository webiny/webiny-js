import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

type SelectLabelProps = SelectPrimitives.SelectLabelProps;

const SelectLabel = ({ className, ...props }: SelectPrimitives.SelectLabelProps) => (
    <SelectPrimitives.Label
        className={cn(
            "py-sm px-md text-neutral-strong text-sm font-semibold uppercase",
            className
        )}
        {...props}
    />
);

export { SelectLabel, type SelectLabelProps };
