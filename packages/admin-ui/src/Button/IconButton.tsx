import React from "react";
import { Slot } from "radix-ui";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils";

const iconButtonWrapperVariants = cva("wby-inline-block", {
    variants: {
        disabled: {
            true: "wby-cursor-not-allowed",
            false: "wby-cursor-pointer"
        }
    }
});

const iconButtonVariants = cva(
    [
        "wby-border-transparent wby-rounded wby-flex wby-flex-shrink-0 wby-items-center wby-justify-center wby-ring-offset-background wby-transition-colors",
        "[&_svg]:wby-pointer-events-none [&_svg]:wby-shrink-0",
        "[&_img]:wby-pointer-events-none [&_img]:wby-shrink-0",
        "aria-disabled:wby-pointer-events-none",
        "focus-visible:wby-outline-none focus-visible:wby-border-accent-default"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "wby-bg-primary wby-fill-neutral-base",
                    "hover:wby-bg-primary-strong",
                    "active:wby-bg-primary-xstrong",
                    "aria-disabled:wby-bg-primary-disabled",
                    "focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed"
                ],
                secondary: [
                    "wby-bg-neutral-dimmed wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-muted",
                    "active:wby-bg-neutral-strong",
                    "aria-disabled:wby-bg-neutral-disabled aria-disabled:wby-fill-neutral-strong",
                    "focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed"
                ],
                tertiary: [
                    "wby-bg-neutral-base wby-border-neutral-muted wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-light",
                    "active:wby-bg-neutral-muted",
                    "aria-disabled:wby-bg-neutral-disabled aria-disabled:wby-fill-neutral-strong aria-disabled:wby-border-neutral-dimmed",
                    "focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed"
                ],
                ghost: [
                    "wby-bg-transparent wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-dimmed",
                    "active:wby-bg-neutral-muted",
                    "aria-disabled:wby-fill-neutral-strong hover:aria-disabled:wby-bg-transparent active:aria-disabled:wby-bg-transparent"
                ],
                "ghost-negative": [
                    "wby-bg-transparent wby-fill-neutral-base",
                    "hover:wby-bg-neutral-base/20",
                    "active:wby-bg-neutral-base/30",
                    "focus-visible:!wby-border-neutral-base",
                    "aria-disabled:wby-fill-neutral-base aria-disabled:wby-opacity-50 hover:aria-disabled:wby-bg-transparent active:aria-disabled:wby-bg-transparent"
                ]
            },
            size: {
                xxs: "wby-border-sm wby-rounded-xs wby-size-sm-extra [&_svg]:wby-size-md [&_img]:wby-size-md",
                xs: "wby-border-sm wby-rounded-xs wby-size-md [&_svg]:wby-size-md [&_img]:wby-size-md",
                sm: "wby-border-sm wby-rounded-sm",
                md: "wby-border-sm wby-rounded-md",
                lg: "wby-border-sm wby-rounded-md",
                xl: "wby-border-md wby-rounded-lg wby-p-[calc(theme(padding.md)-theme(borderWidth.md))] [&_svg]:wby-size-lg [&_img]:wby-size-lg"
            },
            iconSize: {
                default: "",
                lg: ""
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
                iconSize: "default",
                className:
                    "wby-p-[calc(theme(padding.xs)-theme(borderWidth.sm))] [&_svg]:wby-size-md [&_img]:wby-size-md"
            },
            {
                size: "sm",
                iconSize: "lg",
                className:
                    "wby-p-[calc(theme(padding.xxs)-theme(borderWidth.sm))] [&_svg]:wby-size-md-plus [&_img]:wby-size-md-plus"
            },
            {
                size: "md",
                iconSize: "default",
                className:
                    "wby-p-[calc(theme(padding.sm)-theme(borderWidth.sm))] [&_svg]:wby-size-md [&_img]:wby-size-md"
            },
            {
                size: "md",
                iconSize: "lg",
                className:
                    "wby-p-[calc(theme(padding.xs)-theme(borderWidth.sm))] [&_svg]:wby-size-lg [&_img]:wby-size-lg"
            },
            {
                size: "lg",
                iconSize: "default",
                className:
                    "wby-p-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))] [&_svg]:wby-size-md-plus [&_img]:wby-size-md-plus"
            },
            {
                size: "lg",
                iconSize: "lg",
                className:
                    "wby-p-[calc(theme(padding.sm)-theme(borderWidth.sm))] [&_svg]:wby-size-lg [&_img]:wby-size-lg"
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "md",
            iconSize: "default"
        }
    }
);

interface IconButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
        VariantProps<typeof iconButtonVariants> {
    icon?: React.ReactNode;
    asChild?: boolean;
}

const DecoratableIconButton = ({
    className,
    variant,
    size,
    icon,
    iconSize,
    asChild = false,
    disabled,
    ...props
}: IconButtonProps) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
        <span className={cn(iconButtonWrapperVariants({ disabled }))}>
            <Comp
                {...props}
                className={cn(iconButtonVariants({ variant, size, iconSize }), className)}
                disabled={disabled}
                aria-disabled={disabled}
            >
                {icon}
            </Comp>
        </span>
    );
};

const IconButton = makeDecoratable("IconButton", DecoratableIconButton);

export { IconButton, type IconButtonProps, iconButtonVariants };
