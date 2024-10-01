import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";
import { withStaticProps, cn } from "~/utils";

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

const AvatarImageBase = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    AvatarImageProps
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn("aspect-square h-full w-full", className)}
        {...props}
    />
));
AvatarImageBase.displayName = AvatarPrimitive.Image.displayName;

const AvatarImage = makeDecoratable("AvatarImage", AvatarImageBase);

type AvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

const AvatarFallbackBase = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    AvatarFallbackProps
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded bg-primary text-neutral-light",
            className
        )}
        {...props}
    />
));

AvatarFallbackBase.displayName = AvatarPrimitive.Fallback.displayName;

const AvatarFallback = makeDecoratable("AvatarFallback", AvatarFallbackBase);

interface AvatarProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
        VariantProps<typeof avatarVariants> {
    image: React.ReactElement<AvatarImageProps>;
    fallback?: React.ReactElement<AvatarFallbackProps>;
}

const avatarVariants = cva("rounded", {
    variants: {
        size: {
            sm: "w-6 h-6 rounded-sm",
            md: "w-8 h-8 rounded-sm",
            lg: "w-10 h-10 rounded-sm",
            xl: "w-12 h-12 rounded-md"
        }
    },
    defaultVariants: {
        size: "md",
    }
});

const AvatarBase = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
    ({ image, fallback, className, size, ...props }, ref) => (
        <AvatarPrimitive.Root
            ref={ref}
            className={cn(
                "relative flex shrink-0 overflow-hidden",
                avatarVariants({ size, className })
            )}
            {...props}
        >
            {image}
            {fallback}
        </AvatarPrimitive.Root>
    )
);

AvatarBase.displayName = AvatarPrimitive.Root.displayName;

const DecoratableAvatar = makeDecoratable("Avatar", AvatarBase);

const Avatar = withStaticProps(DecoratableAvatar, {
    Fallback: AvatarFallback,
    Image: AvatarImage
});

export { Avatar, type AvatarProps, type AvatarImageProps, type AvatarFallbackProps };
