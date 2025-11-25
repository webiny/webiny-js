import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const widgetTitleVariants = cva("flex items-center gap-sm text-neutral-primary font-semibold", {
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

export type WidgetTitleProps = React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof widgetTitleVariants>;

export const WidgetTitle = ({ className, padding, size, variant, ...props }: WidgetTitleProps) => (
    <div {...props} className={cn(widgetTitleVariants({ padding, size, variant }), className)} />
);

