import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap font-sans leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground hover:bg-primary/90",
                secondary:
                    "bg-gray-200 text-gray-900 fill-gray-900 border-gray-200 hover:bg-gray-300 hover:border-gray-300 hover:text-gray-800 border",
                outline:
                    "bg-white text-gray-900 fill-gray-900 border-gray-400 hover:bg-gray-100 hover:text-gray-900 border",
                ghost: "bg-transparent border-transparent text-gray-900 fill-gray-900 hover:bg-gray-200 border"
            },
            size: {
                sm: "rounded px-2 py-1 text-sm font-normal",
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
