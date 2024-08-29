import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/utils";

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

interface LabelProps
    extends Omit<React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>, "children">,
        VariantProps<typeof labelVariants> {
    text: React.ReactNode;
}

const LabelBase = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
    ({ className, text, ...props }, ref) => (
        <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
            {text}
        </LabelPrimitive.Root>
    )
);
LabelBase.displayName = LabelPrimitive.Root.displayName;

const Label = makeDecoratable("Label", LabelBase);

export { Label, LabelProps };
