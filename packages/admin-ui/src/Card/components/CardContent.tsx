import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { useCardProps } from "~/Card/components/CardProvider.tsx";

const cardContentVariants = cva(
    ["border-md border-solid bg-neutral-base text-md text-neutral-strong overflow-hidden"],
    {
        variants: {
            cornerSize: {
                md: "rounded-lg",
                lg: "rounded-xl"
            },
            variant: {
                default: "border-transparent",
                accent: "border-accent-dimmed"
            }
        },
        defaultVariants: {
            cornerSize: "lg",
            variant: "default"
        }
    }
);

export interface CardContentProps extends VariantProps<typeof cardContentVariants> {
    className?: string;
    children: React.ReactNode;
}

const CardContent = ({ children }: CardContentProps) => {
    const { cornerSize, variant } = useCardProps();

    return (
        <div data-card="content" className={cardContentVariants({ cornerSize, variant })}>
            <div className={"flex flex-col justify-between w-full max-w-full h-full relative"}>
                {children}
            </div>
        </div>
    );
};

CardContent.displayName = "CardContent";

export { CardContent };
