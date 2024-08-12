import React from "react";
import { Title as TitlePrimitive } from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";

export const DialogTitle = React.forwardRef<
    React.ElementRef<typeof TitlePrimitive>,
    React.ComponentPropsWithoutRef<typeof TitlePrimitive>
>(({ className, ...props }, ref) => (
    <TitlePrimitive
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
DialogTitle.displayName = TitlePrimitive.displayName;
