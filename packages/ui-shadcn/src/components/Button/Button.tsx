import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib";

const buttonVariants = cva(
    "font-sans inline-flex items-center justify-center whitespace-nowrap leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-brand text-white fill-white hover:bg-brand-700",
                secondary:
                    "bg-gray-200 text-gray-900 fill-gray-900 border border-gray-200 hover:bg-gray-300 hover:border-gray-300 hover:text-gray-800",
                outline:
                    "bg-white text-gray-900 fill-gray-900 border border-gray-400 hover:bg-gray-100 hover:text-gray-900",
                ghost: "bg-transparent border border-transparent text-gray-900 fill-gray-900 hover:bg-gray-200"
            },
            size: {
                sm: "p-1 rounded text-xs font-normal",
                md: "py-1.5 px-2 rounded text-sm font-normal",
                lg: "py-2.5 px-3 rounded-lg text-sm font-medium",
                xl: "py-3.5 px-4 rounded-lg text-base font-medium"
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
    /**
     * Make button flat (only applicable to Primary button).
     * @deprecated
     */
    flat?: boolean;

    /**
     * Make button smaller.
     * @deprecated: use `size={"sm"}` instead
     */
    small?: boolean;

    /**
     * Show ripple effect on button click.
     * @deprecated
     */
    ripple?: boolean;

    /**
     * Returning `any` allows us to pass callbacks to the button without worrying about their
     * specific return types. Buttons don't use return values from callbacks, so we don't have to worry
     * about their return types at all.
     */
    onClick?: (event: React.MouseEvent<any, MouseEvent>) => any;

    /**
     * Label and optionally an icon (using Button.Icon component).
     */
    children?: React.ReactNode;

    /**
     * Additional button class name.
     */
    className?: string;

    /**
     * Is button disabled?
     */
    disabled?: boolean;

    /**
     * Additional inline styles.
     */
    style?: { [key: string]: any };

    /**
     * ID of the element for testing purposes.
     */
    "data-testid"?: string;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, small, size: propSize, asChild = false, ...props }, ref) => {
        const size = small ? "sm" : propSize;
        const Comp = asChild ? Slot : "button";

        return (
            <Comp
                className={cn(
                    buttonVariants({ variant, size, className }),
                    "webiny-ui-button",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

/**
 * @deprecated use <Button variant={"ghost"}> instead
 */
const ButtonDefault = ({ children, ...others }: ButtonProps) => {
    return (
        <Button {...others} variant={"ghost"}>
            {children}
        </Button>
    );
};

/**
 * @deprecated use <Button variant={"primary"}> instead
 */
const ButtonPrimary = ({ className, ...others }: ButtonProps) => {
    return (
        <Button
            {...others}
            variant={"primary"}
            className={cn("webiny-ui-button webiny-ui-button--primary", className)}
        />
    );
};

/**
 * @deprecated use <Button variant={"secondary"}> instead
 */
const ButtonSecondary = ({ className, ...others }: ButtonProps) => {
    return (
        <Button
            {...others}
            variant={"secondary"}
            className={cn("webiny-ui-button webiny-ui-button--secondary", className)}
        />
    );
};

/**
 * @deprecated use <Button variant={"outline"}> instead
 */
const ButtonOutline = ({ className, ...others }: ButtonProps) => {
    return (
        <Button
            {...others}
            variant={"outline"}
            className={cn("webiny-ui-button webiny-ui-button--outline", className)}
        />
    );
};

export { Button, ButtonDefault, ButtonPrimary, ButtonSecondary, ButtonOutline, buttonVariants };
