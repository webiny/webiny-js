import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "~/utils.js";

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Description
>;

export const DialogDescription = ({ className, ...props }: DialogDescriptionProps) => (
    <DialogPrimitive.Description
        {...props}
        className={cn("text-sm text-neutral-strong text-left", className)}
    />
);
