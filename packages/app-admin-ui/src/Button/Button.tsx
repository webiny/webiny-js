import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";

const buttonVariants = cva(
    "font-sans inline-flex items-center justify-center whitespace-nowrap leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground hover:bg-primary/90",
                secondary:
                    "bg-gray-200 text-gray-900 fill-gray-900 border border-gray-200 hover:bg-gray-300 hover:border-gray-300 hover:text-gray-800",
                outline:
                    "bg-white text-gray-900 fill-gray-900 border border-gray-400 hover:bg-gray-100 hover:text-gray-900",
                ghost: "bg-transparent border border-transparent text-gray-900 fill-gray-900 hover:bg-gray-200"
            },
            size: {
                sm: "p-1 rounded text-sm font-normal",
                md: "py-1.5 px-2 rounded text-md font-normal",
                lg: "py-2.5 px-3 rounded-lg text-base font-medium",
                xl: "py-3.5 px-4 rounded-lg text-lg font-medium"
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
