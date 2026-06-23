import React from "react";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils.js";

const skeletonVariants = cva("rounded-sm", {
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
        },
        shade: {
            dark: "animate-skeleton-pulse",
            light: "animate-skeleton-pulse-light"
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
        size: "lg",
        shade: "dark"
    }
});

interface SkeletonProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

const DecoratableSkeleton = ({ size, type, shade, className, ...props }: SkeletonProps) => {
    return <div className={cn(skeletonVariants({ size, type, shade }), className)} {...props} />;
};

const Skeleton = makeDecoratable("Skeleton", DecoratableSkeleton);

export { Skeleton, type SkeletonProps };
