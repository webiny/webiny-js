import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils";

const dialogFooterVariants = cva("wby-flex wby-justify-between", {
    variants: {
        size: {
            sm: "wby-p-md-extra",
            md: "wby-p-md-extra",
            lg: "wby-p-lg",
            xl: "wby-p-lg",
            full: "wby-p-lg"
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
                <div className={"wby-text-sm wby-flex wby-items-center"}>
                    <div>{info}</div>
                </div>
            )}
            {actions && <div className={"wby-flex wby-gap-x-sm wby-ml-auto"}>{actions}</div>}
        </div>
    );
};
