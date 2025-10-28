import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const cardTitleVariants = cva("flex items-center gap-sm text-neutral-primary font-semibold", {
    variants: {
        padding: {
            sm: "text-h6",
            md: "text-h5",
            lg: "text-h5"
        },
        size: {
            sm: "",
            md: "pt-xs"
        },
        variant: {
            default: "",
            accent: "bg-primary-subtle text-accent-primary"
        }
    },
    defaultVariants: {
        padding: "md",
        size: "md"
    }
});

export type CardTitleProps = React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof cardTitleVariants>;

export const CardTitle = ({ className, padding, size, variant, ...props }: CardTitleProps) => (
    <div {...props} className={cn(cardTitleVariants({ padding, size, variant }), className)} />
);
