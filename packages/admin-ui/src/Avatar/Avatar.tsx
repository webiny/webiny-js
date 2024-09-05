import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";

interface AvatarRootProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
        VariantProps<typeof avatarRootVariants> {}

const avatarRootVariants = cva("rounded", {
    variants: {
        size: {
            sm: "w-6 h-6",
            md: "w-8 h-8",
            lg: "w-10 h-10",
            xl: "w-12 h-12 rounded-lg"
        },
        variant: {
            image: ""
        }
    },
    defaultVariants: {
        size: "md",
        variant: "image"
    }
});

const AvatarRootBase = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    AvatarRootProps
>(({ className, size, variant, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex shrink-0 overflow-hidden",
            avatarRootVariants({ variant, size, className })
        )}
        {...props}
    />
));
AvatarRootBase.displayName = AvatarPrimitive.Root.displayName;

const AvatarRoot = makeDecoratable("AvatarRoot", AvatarRootBase);

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

interface AvatarFallbackProps
    extends Omit<
        React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
        "content" | "children"
    > {
    content: React.ReactNode;
}

const AvatarFallbackBase = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    AvatarFallbackProps
>(({ className, content, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted",
            className
        )}
        {...props}
    >
        {content}
    </AvatarPrimitive.Fallback>
));
AvatarFallbackBase.displayName = AvatarPrimitive.Fallback.displayName;

const AvatarFallback = makeDecoratable("AvatarFallback", AvatarFallbackBase);

interface AvatarProps extends AvatarRootProps {
    image: React.ReactElement<AvatarImageProps>;
    fallback?: React.ReactElement<AvatarFallbackProps>;
}

const Avatar = (props: AvatarProps) => {
    const { image, fallback, ...rest } = props;

    return (
        <AvatarRoot {...rest}>
            {image}
            {fallback}
        </AvatarRoot>
    );
};

export {
    Avatar,
    AvatarFallback,
    AvatarImage,
    type AvatarProps,
    type AvatarImageProps,
    type AvatarFallbackProps
};
