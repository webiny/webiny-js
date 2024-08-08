import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
    "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap border border-transparent font-sans leading-tight transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300",
                secondary: "bg-background-muted text-dark hover:bg-background",
                outline: "border-muted bg-background-white text-dark hover:bg-background-subtle",
                ghost: "bg-background-white text-dark"
            },
            size: {
                sm: "rounded px-2 py-1 text-xs font-normal",
                md: "rounded px-3 py-1.5 text-sm font-normal",
                lg: "rounded-lg px-4 py-2.5 text-base font-medium",
                xl: "rounded-lg px-5 py-3.5 text-lg font-medium"
            }
        },
        defaultVariants: {
            variant: "primary",
            size: "md"
        }
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
