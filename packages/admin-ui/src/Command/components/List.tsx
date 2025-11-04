import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";

type ListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const List = ({ className, ...props }: ListProps) => {
    return (
        <CommandPrimitive.List
            className={cn(
                [
                    "block max-h-96 w-full py-sm overflow-y-auto overflow-x-hidden bg-neutral-base text-neutral-strong"
                ],
                className
            )}
            {...props}
        />
    );
};

export { List, type ListProps };
