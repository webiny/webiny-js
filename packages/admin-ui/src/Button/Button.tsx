import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";
import { makeDecoratable } from "@webiny/react-composition";

const buttonVariants = cva(
    "font-sans inline-flex items-center justify-center whitespace-nowrap leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-primary-foreground hover:bg-primary/90 [&>svg]:fill-white",
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

interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
        VariantProps<typeof buttonVariants> {
    text?: React.ReactNode;

    icon?: React.ReactNode;

    iconPosition?: "start" | "end";

    asChild?: boolean;
}

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { className, variant, size, asChild = false, text, icon, iconPosition, ...rest } = props;
    const Comp = asChild ? Slot : "button";

    return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...rest}>
            {iconPosition !== "end" && icon}
            {text}
            {iconPosition === "end" && icon}
        </Comp>
    );
});

ButtonBase.displayName = "Button";

const Button = makeDecoratable("Button", ButtonBase);

export { Button, type ButtonProps };
