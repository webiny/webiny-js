import React from "react";
import type { VariantProps } from "~/utils.js";
import { cn, cva } from "~/utils.js";

const cardRootVariants = cva(
    "flex flex-col bg-neutral-base gap-y-md-plus text-sm",
    {
        variants: {
            padding: {
                standard: "p-lg",
                comfortable: "p-xl",
                compact: "p-md"
            },
            elevation: {
                none: "",
                xs: "shadow-xs",
                sm: "shadow-sm",
                md: "shadow-md",
                lg: "shadow-lg",
                xl: "shadow-xl"
            },
            borderRadius: {
                none: "rounded-none",
                sm: "rounded-sm",
                md: "rounded-md"
            }
        },
        defaultVariants: {
            padding: "standard",
            elevation: "none",
            borderRadius: "md"
        }
    }
);

interface CardRootProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
        VariantProps<typeof cardRootVariants> {}

const CardRoot = ({ className, padding, elevation, borderRadius, ...props }: CardRootProps) => (
    <div
        className={cn(cardRootVariants({ padding, elevation, borderRadius }), className)}
        {...props}
    />
);

export { CardRoot, type CardRootProps, cardRootVariants };
