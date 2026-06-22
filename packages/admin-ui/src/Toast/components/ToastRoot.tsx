import React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const toastRootVariants = cva(
    "group pointer-events-auto relative flex w-full items-center justify-start p-md gap-sm-extra self-stretch overflow-hidden rounded-md border-sm border-neutral-dimmed shadow-lg",
    {
        variants: {
            variant: {
                default: "default-variant bg-neutral-dark",
                subtle: "subtle-variant bg-neutral-elevated"
            },
            hasDescription: {
                true: "has-description items-start justify-start"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

type ToastRootProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof toastRootVariants>;

const ToastRoot = ({ className, hasDescription, variant, children, ...props }: ToastRootProps) => {
    return (
        <div className={cn(toastRootVariants({ variant, hasDescription }), className)} {...props}>
            {children}
        </div>
    );
};

export { ToastRoot, type ToastRootProps, toastRootVariants };
