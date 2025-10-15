import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const cardTitleVariants = cva("wby-flex wby-items-center wby-gap-sm", {
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

export type CardTitleProps = React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof cardTitleVariants>;

export const CardTitle = ({ className, size, ...props }: CardTitleProps) => (
    <div {...props} className={cn(cardTitleVariants({ size }), className)} />
);
