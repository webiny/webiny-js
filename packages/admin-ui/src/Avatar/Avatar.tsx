import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { withStaticProps, cn, makeDecoratable, cva, type VariantProps } from "~/utils.js";
import {
    AvatarFallback,
    AvatarImage,
    type AvatarFallbackProps,
    type AvatarImageProps
} from "./components/index.js";

interface AvatarProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
        VariantProps<typeof avatarVariants> {
    image?: React.ReactElement<AvatarImageProps>;
    fallback?: React.ReactElement<AvatarFallbackProps>;
}

const avatarVariants = cva("relative flex shrink-0 overflow-hidden", {
    variants: {
        size: {
            sm: "text-h6 rounded-sm size-[24px] [&_svg]:size-[16px]",
            md: "text-h6 rounded-md size-[32px] [&_svg]:size-[24px]",
            lg: "text-h6 rounded-md size-[40px] [&_svg]:size-[24px]",
            xl: "text-h4 rounded-lg size-[48px] [&_svg]:size-[24px]"
        },
        variant: {
            strong: "bg-primary text-neutral-light [&_svg]:fill-neutral-base",
            subtle: "bg-neutral-light text-neutral-primary [&_svg]:fill-neutral-xstrong",
            light: "bg-neutral-dimmed text-neutral-primary [&_svg]:fill-neutral-xstrong",
            quiet: "bg-transparent text-neutral-primary [&_svg]:fill-neutral-xstrong",
            outlined:
                "bg-neutral-base !border-neutral-muted border-sm text-accent-primary [&_svg]:fill-neutral-xstrong"
        }
    },
    defaultVariants: {
        size: "md",
        variant: "strong"
    }
});

const AvatarBase = ({ image, fallback, className, size, variant, ...props }: AvatarProps) => {
    return (
        <AvatarPrimitive.Root
            className={cn(avatarVariants({ variant, size }), className)}
            {...props}
        >
            {image}
            {fallback}
        </AvatarPrimitive.Root>
    );
};

const Avatar = withStaticProps(makeDecoratable("Avatar", AvatarBase), {
    Fallback: AvatarFallback,
    Image: AvatarImage
});

export { Avatar, type AvatarProps, type AvatarImageProps, type AvatarFallbackProps };
