import React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const resizerVariants = cva(
    [
        "absolute right-0 top-0 w-md h-full border-r-md border-r-accent-default cursor-col-resize select-none touch-none",
        "opacity-0 bg-transparent",
        "hover:opacity-100"
    ],
    {
        variants: {
            isResizing: {
                true: "opacity-100"
            }
        }
    }
);

interface ResizerProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof resizerVariants> {}

const Resizer = ({ className, isResizing, ...props }: ResizerProps) => (
    <div className={cn(resizerVariants({ isResizing }), className)} {...props} />
);

export { Resizer, type ResizerProps };
