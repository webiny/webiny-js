import React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "~/utils.js";

type ProgressRootProps = ProgressPrimitive.ProgressProps;

const ProgressRoot = ({ className, ...props }: ProgressRootProps) => {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            className={cn(
                "bg-neutral-muted relative h-xs-plus w-full overflow-hidden rounded-full",
                className
            )}
            {...props}
        />
    );
};

export { ProgressRoot, type ProgressRootProps };
