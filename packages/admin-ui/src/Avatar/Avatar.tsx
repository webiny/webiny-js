import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "~/utils";
import { makeDecoratable } from "@webiny/react-composition";

const AvatarRootBase = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
    />
));
AvatarRootBase.displayName = AvatarPrimitive.Root.displayName;

const AvatarRoot = makeDecoratable("AvatarRoot", AvatarRootBase);

const AvatarImageBase = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
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

interface AvatarProps {
    image: React.ReactElement<typeof AvatarImage>;
    fallback?: string | React.ReactElement<typeof AvatarFallback>;
}

const Avatar = (props: AvatarProps) => {
    const { image, fallback } = props;

    return (
        <AvatarRoot>
            {image}
            {typeof fallback === "string" ? <AvatarFallback content={fallback} /> : fallback}
        </AvatarRoot>
    );
};

export { Avatar, AvatarFallback, AvatarImage, type AvatarProps };
