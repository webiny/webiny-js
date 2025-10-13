import * as React from "react";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";
import { SelectIcon } from "./SelectIcon.js";

const selectTriggerVariants = cva(
    [
        "w-full flex items-center justify-between gap-sm border-sm text-md relative",
        "focus:outline-none",
        "disabled:pointer-events-none"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-neutral-base border-neutral-muted text-neutral-strong placeholder:text-neutral-dimmed fill-neutral-xstrong",
                    "hover:border-neutral-strong",
                    "focus:border-neutral-black",
                    "data-[state=open]:border-neutral-black",
                    "disabled:bg-neutral-disabled disabled:border-neutral-dimmed disabled:text-neutral-disabled disabled:placeholder:text-neutral-disabled disabled:fill-neutral-disabled"
                ],
                secondary: [
                    "bg-neutral-light border-neutral-subtle text-neutral-strong placeholder:text-neutral-muted fill-neutral-xstrong",
                    "hover:bg-neutral-dimmed",
                    "focus:border-neutral-black focus:bg-neutral-base",
                    "data-[state=open]:border-neutral-black data-[state=open]:bg-neutral-base",
                    "disabled:bg-neutral-disabled disabled:border-neutral-dimmed disabled:text-neutral-disabled disabled:placeholder:text-neutral-disabled disabled:fill-neutral-disabled"
                ],
                ghost: [
                    "bg-neutral-base border-transparent text-neutral-strong placeholder:text-neutral-dimmed",
                    "hover:bg-neutral-dark/5",
                    "focus:bg-neutral-dark/5",
                    "data-[state=open]:bg-neutral-dark/5",
                    "disabled:bg-neutral-disabled disabled:border-neutral-dimmed disabled:text-neutral-disabled disabled:placeholder:text-neutral-disabled disabled:fill-neutral-disabled"
                ],
                "ghost-negative": [
                    "bg-transparent border-transparent text-neutral-light/50 placeholder:text-neutral-light/50 fill-neutral-base/50",
                    "hover:bg-neutral-base/20",
                    "focus:bg-neutral-base/20",
                    "data-[state=open]:bg-neutral-base data-[state=open]:text-neutral-primary data[state=open]:placeholder:text-neutral-dimmed data[state=open]:!fill-neutral-xstrong",
                    "disabled:bg-transparent disabled:text-neutral-disabled/50 disabled:placeholder:text-neutral-disabled/50"
                ]
            },
            size: {
                md: [
                    "rounded-md",
                    "py-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                lg: [
                    "rounded-md",
                    "py-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))] px-[calc(theme(padding.sm-extra)-theme(borderWidth.sm))]"
                ],
                xl: [
                    "rounded-lg leading-6",
                    "py-[calc(theme(padding.md)-theme(borderWidth.sm))] px-[calc(theme(padding.md)-theme(borderWidth.sm))]"
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
                class: "!border-destructive-default"
            },
            {
                variant: "secondary",
                invalid: true,
                class: "!border-destructive-default"
            },
            {
                variant: "ghost",
                invalid: true,
                class: "!border-destructive-subtle !bg-destructive-subtle"
            },
            {
                variant: "ghost-negative",
                invalid: true,
                class: "!border-destructive-default !bg-destructive-subtle text-neutral-primary placeholder:text-neutral-dimmed !fill-neutral-xstrong"
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
