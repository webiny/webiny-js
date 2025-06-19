import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "~/utils";

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Description
>;

export const DialogDescription = ({ className, ...props }: DialogDescriptionProps) => (
    <DialogPrimitive.Description
        {...props}
        className={cn("wby-text-sm wby-text-neutral-strong wby-text-left", className)}
    />
);
