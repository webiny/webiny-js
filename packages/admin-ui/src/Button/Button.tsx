import React, { useMemo } from "react";
import { Slot } from "radix-ui";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils.js";

const buttonWrapperVariants = cva("inline-block", {
    variants: {
        disabled: {
            true: "cursor-not-allowed",
            false: "cursor-pointer"
        }
    }
});

const buttonVariants = cva(
    [
        "border-transparent rounded font-sans inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors !no-underline",
        "aria-disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:border-accent-default"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-primary text-neutral-light fill-neutral-base",
                    "hover:bg-primary-strong",
                    "active:bg-primary-xstrong",
                    "aria-disabled:bg-primary-disabled",
                    "focus-visible:ring-lg focus-visible:ring-primary-dimmed"
                ],
                secondary: [
                    "bg-neutral-dimmed text-neutral-strong fill-neutral-xstrong",
                    "hover:bg-neutral-muted",
                    "active:bg-neutral-strong",
                    "aria-disabled:bg-neutral-disabled aria-disabled:text-neutral-disabled aria-disabled:fill-neutral-strong",
                    "focus-visible:ring-lg focus-visible:ring-primary-dimmed"
                ],
                tertiary: [
                    "bg-neutral-base text-neutral-strong border-neutral-muted fill-neutral-xstrong",
                    "hover:bg-neutral-light",
                    "active:bg-neutral-muted",
                    "aria-disabled:bg-neutral-disabled aria-disabled:border-neutral-dimmed aria-disabled:text-neutral-disabled aria-disabled:fill-neutral-strong",
                    "focus-visible:ring-lg focus-visible:ring-primary-dimmed"
                ],
                ghost: [
                    "bg-transparent text-neutral-strong fill-neutral-xstrong",
                    "hover:bg-neutral-dimmed",
                    "active:bg-neutral-muted",
                    "aria-disabled:text-neutral-disabled aria-disabled:fill-neutral-strong"
                ],
                "ghost-negative": [
                    "bg-transparent text-neutral-light fill-neutral-base",
                    "hover:bg-neutral-base/20",
                    "active:bg-neutral-base/30",
                    "aria-disabled:text-neutral-disabled aria-disabled:fill-neutral-base/50",
                    "focus-visible:!border-neutral-base"
                ]
            },
            size: {
                sm: [
                    "text-sm border-sm rounded-sm [&>svg]:size-md",
                    "py-[calc(theme(padding.xs)-theme(borderWidth.sm))] px-[calc(theme(padding.sm)-theme(borderWidth.sm))]"
                ],
                md: [
                    "text-md border-sm rounded-md [&>svg]:size-md",
                    "py-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                lg: [
                    "text-md border-sm rounded-md [&>svg]:size-md-plus",
                    "py-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))] px-[calc(theme(padding.md)-theme(borderWidth.sm))]"
                ],
                xl: [
                    "text-lg font-semibold border-lg rounded-md [&>svg]:size-lg",
                    "py-[calc(theme(padding.md-plus)-theme(borderWidth.md))] px-[calc(theme(padding.md)-theme(borderWidth.md))]"
                ]
            },
            contentLayout: {
                text: "",
                icon: "",
                "text-icon-start": "",
                "text-icon-end": ""
            }
        },
        compoundVariants: [
            {
                size: "xl",
                variant: "ghost",
                className: "focus-visible:border-md"
            },
            {
                size: "sm",
                contentLayout: "icon",
                className: "p-[calc(theme(padding.xs)-theme(borderWidth.sm))]"
            },
            {
                size: "sm",
                contentLayout: "text-icon-start",
                className: "pl-[calc(theme(padding.xs)-theme(borderWidth.sm))] [&>svg]:mr-xs"
            },
            {
                size: "sm",
                contentLayout: "text-icon-end",
                className: "pr-[calc(theme(padding.xs)-theme(borderWidth.sm))] [&>svg]:ml-xs"
            },
            {
                size: "md",
                contentLayout: "icon",
                className: "p-[calc(theme(padding.sm)-theme(borderWidth.sm))]"
            },
            {
                size: "md",
                contentLayout: "text-icon-start",
                className: "pl-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] [&>svg]:mr-xs"
            },
            {
                size: "md",
                contentLayout: "text-icon-end",
                className: "pr-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] [&>svg]:ml-xs"
            },
            {
                size: "lg",
                contentLayout: "icon",
                className: "p-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))]"
            },
            {
                size: "lg",
                contentLayout: "text-icon-start",
                className:
                    "pl-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))] [&>svg]:mr-xs-plus"
            },
            {
                size: "lg",
                contentLayout: "text-icon-end",
                className:
                    "pr-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))] [&>svg]:ml-xs-plus"
            },
            {
                size: "xl",
                contentLayout: "icon",
                className: "p-[calc(theme(padding.md)-theme(borderWidth.md))]"
            },
            {
                size: "xl",
                contentLayout: "text-icon-start",
                className: "pl-[calc(theme(padding.sm-extra)-theme(borderWidth.md))] [&>svg]:mr-sm"
            },
            {
                size: "xl",
                contentLayout: "text-icon-end",
                className: "pr-[calc(theme(padding.sm-extra)-theme(borderWidth.md))] [&>svg]:ml-sm"
            }
        ],
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

    containerClassName?: string;
}

type ContentLayout = "text" | "icon" | "text-icon-start" | "text-icon-end";

const ButtonBase = ({
    className,
    variant,
    size,
    asChild = false,
    text,
    icon,
    iconPosition = "start",
    disabled,
    containerClassName,
    ...rest
}: ButtonProps) => {
    const Comp = asChild ? Slot.Root : "button";

    const contentLayout = useMemo<ContentLayout>(() => {
        if (!text) {
            return "icon";
        }

        if (!icon) {
            return "text";
        }

        return `text-icon-${iconPosition}` as ContentLayout;
    }, [text, icon, iconPosition]);

    const cssClasses = cn(
        buttonVariants({
            variant,
            size,
            contentLayout
        }),
        className
    );

    return (
        <span className={cn(buttonWrapperVariants({ disabled }), containerClassName)}>
            <Comp className={cssClasses} disabled={disabled} aria-disabled={disabled} {...rest}>
                {iconPosition !== "end" && icon}
                <Slot.Slottable>{text}</Slot.Slottable>
                {iconPosition === "end" && icon}
            </Comp>
        </span>
    );
};

const Button = makeDecoratable("Button", ButtonBase);

export { Button, type ButtonProps, buttonVariants };
