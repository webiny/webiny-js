import React, { useMemo } from "react";
import { Slot } from "radix-ui";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils";

const buttonWrapperVariants = cva("wby-inline-block", {
    variants: {
        disabled: {
            true: "wby-cursor-not-allowed",
            false: "wby-cursor-pointer"
        }
    }
});

const buttonVariants = cva(
    [
        "wby-border-transparent wby-rounded wby-font-sans wby-inline-flex wby-items-center wby-justify-center wby-whitespace-nowrap wby-ring-offset-background wby-transition-colors !wby-no-underline",
        "aria-disabled:wby-pointer-events-none",
        "focus-visible:wby-outline-none focus-visible:wby-border-accent-default"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "wby-bg-primary wby-text-neutral-light wby-fill-neutral-base",
                    "hover:wby-bg-primary-strong",
                    "active:wby-bg-primary-xstrong",
                    "aria-disabled:wby-bg-primary-disabled",
                    "focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed"
                ],
                secondary: [
                    "wby-bg-neutral-dimmed wby-text-neutral-strong wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-muted",
                    "active:wby-bg-neutral-strong",
                    "aria-disabled:wby-bg-neutral-disabled aria-disabled:wby-text-neutral-disabled aria-disabled:wby-fill-neutral-strong",
                    "focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed"
                ],
                tertiary: [
                    "wby-bg-neutral-base wby-text-neutral-strong wby-border-neutral-muted wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-light",
                    "active:wby-bg-neutral-muted",
                    "aria-disabled:wby-bg-neutral-disabled aria-disabled:wby-border-neutral-dimmed aria-disabled:wby-text-neutral-disabled aria-disabled:wby-fill-neutral-strong",
                    "focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed"
                ],
                ghost: [
                    "wby-text-neutral-strong wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-dimmed",
                    "active:wby-bg-neutral-muted",
                    "aria-disabled:wby-text-neutral-disabled aria-disabled:wby-fill-neutral-strong"
                ],
                "ghost-negative": [
                    "wby-text-neutral-light wby-fill-neutral-base",
                    "hover:wby-bg-neutral-base/20",
                    "active:wby-bg-neutral-base/30",
                    "aria-disabled:wby-text-neutral-disabled aria-disabled:wby-fill-neutral-base/50",
                    "focus-visible:!wby-border-neutral-base"
                ]
            },
            size: {
                sm: [
                    "wby-text-sm wby-border-sm wby-rounded-sm [&>svg]:wby-size-md",
                    "wby-py-[calc(theme(padding.xs)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.sm)-theme(borderWidth.sm))]"
                ],
                md: [
                    "wby-text-md wby-border-sm wby-rounded-md [&>svg]:wby-size-md",
                    "wby-py-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                lg: [
                    "wby-text-md wby-border-sm wby-rounded-md [&>svg]:wby-size-md-plus",
                    "wby-py-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.md)-theme(borderWidth.sm))]"
                ],
                xl: [
                    "wby-text-lg wby-font-semibold wby-border-lg wby-rounded-md [&>svg]:wby-size-lg",
                    "wby-py-[calc(theme(padding.md-plus)-theme(borderWidth.md))] wby-px-[calc(theme(padding.md)-theme(borderWidth.md))]"
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
                className: "focus-visible:wby-border-md"
            },
            {
                size: "sm",
                contentLayout: "icon",
                className: "wby-p-[calc(theme(padding.xs)-theme(borderWidth.sm))]"
            },
            {
                size: "sm",
                contentLayout: "text-icon-start",
                className:
                    "wby-pl-[calc(theme(padding.xs)-theme(borderWidth.sm))] [&>svg]:wby-mr-xs"
            },
            {
                size: "sm",
                contentLayout: "text-icon-end",
                className:
                    "wby-pr-[calc(theme(padding.xs)-theme(borderWidth.sm))] [&>svg]:wby-ml-xs"
            },
            {
                size: "md",
                contentLayout: "icon",
                className: "wby-p-[calc(theme(padding.sm)-theme(borderWidth.sm))]"
            },
            {
                size: "md",
                contentLayout: "text-icon-start",
                className:
                    "wby-pl-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] [&>svg]:wby-mr-xs"
            },
            {
                size: "md",
                contentLayout: "text-icon-end",
                className:
                    "wby-pr-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] [&>svg]:wby-ml-xs"
            },
            {
                size: "lg",
                contentLayout: "icon",
                className: "wby-p-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))]"
            },
            {
                size: "lg",
                contentLayout: "text-icon-start",
                className:
                    "wby-pl-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))] [&>svg]:wby-mr-xs-plus"
            },
            {
                size: "lg",
                contentLayout: "text-icon-end",
                className:
                    "wby-pr-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))] [&>svg]:wby-ml-xs-plus"
            },
            {
                size: "xl",
                contentLayout: "icon",
                className: "wby-p-[calc(theme(padding.md)-theme(borderWidth.md))]"
            },
            {
                size: "xl",
                contentLayout: "text-icon-start",
                className:
                    "wby-pl-[calc(theme(padding.sm-extra)-theme(borderWidth.md))] [&>svg]:wby-mr-sm"
            },
            {
                size: "xl",
                contentLayout: "text-icon-end",
                className:
                    "wby-pr-[calc(theme(padding.sm-extra)-theme(borderWidth.md))] [&>svg]:wby-ml-sm"
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
