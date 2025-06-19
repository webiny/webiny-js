import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";
import { cn } from "~/utils";

type SelectLabelProps = SelectPrimitives.SelectLabelProps;

const SelectLabel = ({ className, ...props }: SelectPrimitives.SelectLabelProps) => (
    <SelectPrimitives.Label
        className={cn(
            "wby-py-sm wby-px-md wby-text-neutral-strong wby-text-sm wby-font-semibold wby-uppercase",
            className
        )}
        {...props}
    />
);

export { SelectLabel, type SelectLabelProps };
