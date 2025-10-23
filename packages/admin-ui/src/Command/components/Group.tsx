import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";

type GroupProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

const Group = ({ className, ...props }: GroupProps) => (
    <CommandPrimitive.Group
        className={cn(
            "**:[[cmdk-group-heading]]:px-sm **:[[cmdk-group-heading]]:py-xs-plus **:[[cmdk-group-heading]]:text-sm **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-neutral-strong",
            className
        )}
        {...props}
    />
);

export { Group, type GroupProps };
