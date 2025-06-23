import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const dialogTitleVariants = cva("wby-flex wby-items-center wby-gap-sm", {
    variants: {
        size: {
            sm: "wby-text-h5",
            md: "wby-text-h5",
            lg: "wby-text-h4",
            xl: "wby-text-h4",
            full: "wby-text-h4"
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
