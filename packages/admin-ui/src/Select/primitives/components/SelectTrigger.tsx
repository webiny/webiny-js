import * as React from "react";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";
import { SelectIcon } from "./SelectIcon";

const selectTriggerVariants = cva(
    [
        "wby-w-full wby-flex wby-items-center wby-justify-between wby-gap-sm wby-border-sm wby-text-md wby-relative",
        "focus:wby-outline-none",
        "disabled:wby-pointer-events-none"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "wby-bg-neutral-base wby-border-neutral-muted wby-text-neutral-strong placeholder:wby-text-neutral-dimmed wby-fill-neutral-xstrong",
                    "hover:wby-border-neutral-strong",
                    "focus:wby-border-neutral-black",
                    "data-[state=open]:wby-border-neutral-black",
                    "disabled:wby-bg-neutral-disabled disabled:wby-border-neutral-dimmed disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled disabled:wby-fill-neutral-disabled"
                ],
                secondary: [
                    "wby-bg-neutral-light wby-border-neutral-subtle wby-text-neutral-strong placeholder:wby-text-neutral-muted wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-dimmed",
                    "focus:wby-border-neutral-black focus:wby-bg-neutral-base",
                    "data-[state=open]:wby-border-neutral-black data-[state=open]:wby-bg-neutral-base",
                    "disabled:wby-bg-neutral-disabled disabled:wby-border-neutral-dimmed disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled disabled:wby-fill-neutral-disabled"
                ],
                ghost: [
                    "wby-bg-neutral-base wby-border-transparent wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dark/5",
                    "focus:wby-bg-neutral-dark/5",
                    "data-[state=open]:wby-bg-neutral-dark/5",
                    "disabled:wby-bg-neutral-disabled disabled:wby-border-neutral-dimmed disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled disabled:wby-fill-neutral-disabled"
                ],
                "ghost-negative": [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-light/50 placeholder:wby-text-neutral-light/50 wby-fill-neutral-base/50",
                    "hover:wby-bg-neutral-base/20",
                    "focus:wby-bg-neutral-base/20",
                    "data-[state=open]:wby-bg-neutral-base data-[state=open]:wby-text-neutral-primary data[state=open]:placeholder:wby-text-neutral-dimmed data[state=open]:!wby-fill-neutral-xstrong",
                    "disabled:wby-bg-transparent disabled:wby-text-neutral-disabled/50 disabled:placeholder:wby-text-neutral-disabled/50"
                ]
            },
            size: {
                md: [
                    "wby-rounded-md",
                    "wby-py-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                lg: [
                    "wby-rounded-md",
                    "wby-py-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                xl: [
                    "wby-rounded-lg wby-leading-6",
                    "wby-py-[calc(theme(padding.md)-theme(borderWidth.sm))] wby-px-[calc(theme(padding.md)-theme(borderWidth.sm))]"
                ]
            },
            invalid: {
                true: ""
            }
        },
        compoundVariants: [
            {
                variant: "primary",
                invalid: true,
                class: "!wby-border-destructive-default"
            },
            {
                variant: "secondary",
                invalid: true,
                class: "!wby-border-destructive-default"
            },
            {
                variant: "ghost",
                invalid: true,
                class: "!wby-border-destructive-subtle !wby-bg-destructive-subtle"
            },
            {
                variant: "ghost-negative",
                invalid: true,
                class: "!wby-border-destructive-default !wby-bg-destructive-subtle wby-text-neutral-primary placeholder:wby-text-neutral-dimmed !wby-fill-neutral-xstrong"
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "lg"
        }
    }
);

interface SelectTriggerProps
    extends SelectPrimitives.SelectTriggerProps,
        VariantProps<typeof selectTriggerVariants> {
    startIcon?: React.ReactElement;
    endIcon?: React.ReactElement;
    resetButton?: React.ReactElement;
}

const SelectTrigger = ({
    className,
    children,
    size,
    variant,
    startIcon,
    endIcon = <ChevronDown />,
    resetButton,
    disabled,
    invalid,
    ...props
}: SelectTriggerProps) => (
    <SelectPrimitives.Trigger
        className={cn(selectTriggerVariants({ variant, size, invalid }), className)}
        disabled={disabled}
        {...props}
    >
        {startIcon && <SelectIcon icon={startIcon} />}
        {children}
        {resetButton}
        <SelectIcon icon={endIcon} />
    </SelectPrimitives.Trigger>
);

export { SelectTrigger, selectTriggerVariants };
