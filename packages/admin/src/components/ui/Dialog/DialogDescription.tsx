import React from "react";
import { Description as DescriptionPrimitive } from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";

export const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DescriptionPrimitive>,
    React.ComponentPropsWithoutRef<typeof DescriptionPrimitive>
>(({ className, ...props }, ref) => (
    <DescriptionPrimitive
        ref={ref}
        className={cn("text-muted-foreground text-sm", className)}
        {...props}
    />
));

DialogDescription.displayName = DescriptionPrimitive.displayName;
