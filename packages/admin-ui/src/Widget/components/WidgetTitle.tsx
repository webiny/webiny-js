import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const widgetTitleVariants = cva("flex items-center gap-sm text-neutral-primary font-semibold pt-xs", {
    variants: {
        padding: {
            sm: "text-h6",
            md: "text-h5"
        },
        variant: {
            default: "",
            accent: "bg-primary-subtle text-accent-primary"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export type WidgetTitleProps = React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof widgetTitleVariants>;

export const WidgetTitle = ({ className, padding, variant, ...props }: WidgetTitleProps) => (
    <div {...props} className={cn(widgetTitleVariants({ padding, variant }), className)} />
);

