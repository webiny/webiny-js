import React from "react";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils.js";

const skeletonVariants = cva("animate-skeleton-pulse rounded-sm", {
    variants: {
        type: {
            text: "w-full",
            thumbnail: "aspect-square",
            area: "size-full"
        },
        size: {
            xs: "h-sm",
            sm: "h-sm-extra",
            md: "h-md",
            lg: "h-lg",
            xl: "h-xl",
            xxl: "h-[40px]",
            "3xl": "h-xxl"
        }
    },
    compoundVariants: [
        // The following compound variants are not supported by the current version of the design system.
        {
            type: "thumbnail",
            size: "xs",
            class: "hidden!"
        },
        {
            type: "text",
            size: "3xl",
            class: "hidden!"
        }
    ],
    defaultVariants: {
        type: "area",
        size: "lg"
    }
});

interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

const DecoratableSkeleton = ({ size, type, className, ...props }: SkeletonProps) => {
    return <div className={cn(skeletonVariants({ size, type }), className)} {...props} />;
};

const Skeleton = makeDecoratable("Skeleton", DecoratableSkeleton);

export { Skeleton, type SkeletonProps };
