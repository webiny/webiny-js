import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const dialogTitleVariants = cva("flex items-center gap-sm", {
    variants: {
        size: {
            sm: "text-h5",
            md: "text-h5",
            lg: "text-h4",
            xl: "text-h4",
            full: "text-h4"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> &
    VariantProps<typeof dialogTitleVariants>;

export const DialogTitle = ({ className, size, ...props }: DialogTitleProps) => (
    <DialogPrimitive.Title {...props} className={cn(dialogTitleVariants({ size }), className)} />
);
