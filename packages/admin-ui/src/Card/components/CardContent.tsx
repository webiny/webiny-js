import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const cardContentVariants = cva(
    [
        "wby-fixed wby-left-[50%] wby-top-[50%] wby-border wby-bg-neutral-base focus-visible:outline-none wby-rounded-xl wby-text-md wby-text-neutral-strong wby-max-h-screen",
        "wby-translate-x-[-50%] wby-translate-y-[-50%] wby-duration-200 data-[state=open]:wby-animate-in data-[state=closed]:wby-animate-out data-[state=closed]:wby-fade-out-0 data-[state=open]:wby-fade-in-0 data-[state=closed]:wby-zoom-out-95 data-[state=open]:wby-zoom-in-95 data-[state=closed]:wby-slide-out-to-left-1/2 data-[state=closed]:wby-slide-out-to-top-[48%] data-[state=open]:wby-slide-in-from-left-1/2 data-[state=open]:wby-slide-in-from-top-[48%]",
        "focus:wby-outline-none focus-visible:wby-outline-none",
        "wby-max-w-[calc(100vw-theme(spacing.lg))] wby-max-h-[calc(100vh-theme(spacing.lg))]"
    ],
    {
        variants: {
            size: {
                sm: "wby-w-[384px]",
                md: "wby-w-[520px]",
                lg: "wby-w-[640px]"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

export interface CardContentProps extends VariantProps<typeof cardContentVariants> {
    className?: string;
    children: React.ReactNode;
}

const CardContent = ({ className, size, children, ...props }: CardContentProps) => {
    return (
        <div {...props} className={cn(cardContentVariants({ size }), className)}>
            <div
                className={cn([
                    [
                        "wby-flex wby-flex-col wby-justify-between",
                        "wby-w-full wby-max-w-full",
                        "wby-h-full",
                        "wby-relative"
                    ]
                ])}
            >
                {children}
            </div>
        </div>
    );
};

CardContent.displayName = "CardContent"

export { CardContent };
