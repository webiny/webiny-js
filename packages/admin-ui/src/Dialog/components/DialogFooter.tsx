import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const dialogFooterVariants = cva("flex justify-between", {
    variants: {
        size: {
            sm: "p-md-extra",
            md: "p-md-extra",
            lg: "p-lg",
            xl: "p-lg",
            full: "p-lg"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

export interface DialogFooterProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof dialogFooterVariants> {
    actions?: React.ReactNode;
    info?: React.ReactNode;
}

export const DialogFooter = ({ actions, info, className, size, ...props }: DialogFooterProps) => {
    if (!actions && !info) {
        return null;
    }

    return (
        <div {...props} className={cn(dialogFooterVariants({ size }), className)}>
            {info && (
                <div className={"text-sm flex items-center"}>
                    <div>{info}</div>
                </div>
            )}
            {actions && <div className={"flex gap-x-sm ml-auto"}>{actions}</div>}
        </div>
    );
};
