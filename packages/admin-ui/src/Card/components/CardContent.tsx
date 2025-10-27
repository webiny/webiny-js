import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const cardContentVariants = cva(
    ["border bg-neutral-base rounded-xl text-md text-neutral-strong"],
    {
        variants: {
            cornerSize: {
                md: "rounded-lg",
                lg: "rounded-xl"
            },
            variant: {
                default: '',
                accent: "border-md border-accent-dimmed"
            }
        },
        defaultVariants: {
            cornerSize: "lg",
            variant: 'default'
        }
    }
);

export interface CardContentProps extends VariantProps<typeof cardContentVariants> {
    className?: string;
    children: React.ReactNode;
}

const CardContent = ({ className, children, ...props }: CardContentProps) => {
    return (
        <div {...props} className={cn(cardContentVariants(props), className)}>
            <div
                className={cn([
                    [
                        "flex flex-col justify-between",
                        "w-full max-w-full",
                        "h-full",
                        "relative"
                    ]
                ])}
            >
                {children}
            </div>
        </div>
    );
};

CardContent.displayName = "CardContent";

export { CardContent };
