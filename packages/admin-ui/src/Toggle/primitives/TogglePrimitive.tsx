import * as React from "react";
import { useMemo } from "react";
import { Toggle as TogglePrimitives } from "radix-ui";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";
import { useToggle } from "./useToggle.js";
import type { ToggleItemDto, ToggleItemFormatted } from "../domains/index.js";

/**
 * Toggle Renderer
 */

const toggleVariants = cva(
    [
        "border-sm border-transparent inline-flex items-center justify-center gap-xs whitespace-nowrap font-sans cursor-pointer transition-colors",
        "focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed",
        "disabled:pointer-events-none disabled:opacity-50"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-neutral-dimmed text-neutral-strong",
                    "hover:bg-neutral-muted",
                    "data-[state=on]:bg-neutral-xstrong data-[state=on]:text-neutral-light"
                ],
                outline: [
                    "bg-neutral-base border-neutral-muted text-neutral-strong",
                    "hover:bg-neutral-light",
                    "data-[state=on]:bg-neutral-dimmed"
                ],
                ghost: [
                    "bg-transparent text-neutral-strong",
                    "hover:bg-neutral-dimmed",
                    "data-[state=on]:bg-neutral-muted"
                ],
                "ghost-negative": [
                    "bg-transparent text-neutral-light",
                    "hover:bg-neutral-base/20",
                    "data-[state=on]:bg-neutral-base/30"
                ]
            },
            size: {
                sm: [
                    "text-sm rounded-sm [&>svg]:size-md",
                    "py-[calc(var(--padding-xs)-(var(--border-width-sm)))] px-[calc(var(--padding-sm)-(var(--border-width-sm)))]"
                ],
                md: [
                    "text-md rounded-md [&>svg]:size-md",
                    "py-[calc(var(--padding-xs-plus)-(var(--border-width-sm)))] px-[calc(var(--padding-sm-extra)-(var(--border-width-sm)))]"
                ],
                lg: [
                    "text-md rounded-md [&>svg]:size-md-plus",
                    "py-[calc(var(--padding-sm-plus)-(var(--border-width-sm)))] px-[calc(var(--padding-md)-(var(--border-width-sm)))]"
                ],
                xl: [
                    "text-lg font-semibold rounded-md [&>svg]:size-lg",
                    "py-[calc(theme(padding.md-plus)-(var(--border-width-sm)))] px-[calc(var(--padding-md)-(var(--border-width-sm)))]"
                ]
            },
            contentLayout: {
                text: "",
                icon: ""
            }
        },
        compoundVariants: [
            {
                size: "sm",
                contentLayout: "icon",
                className: "p-[calc(var(--padding-xs)-(var(--border-width-sm)))]"
            },
            {
                size: "md",
                contentLayout: "icon",
                className: "p-[calc(var(--padding-sm)-(var(--border-width-sm)))]"
            },
            {
                size: "lg",
                contentLayout: "icon",
                className: "p-[calc(var(--padding-sm-plus)-(var(--border-width-sm)))]"
            },
            {
                size: "xl",
                contentLayout: "icon",
                className: "p-[calc(var(--padding-md)-(var(--border-width-sm)))]"
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "md"
        }
    }
);

type TogglePrimitiveProps = Omit<
    TogglePrimitives.ToggleProps,
    "defaultPressed" | "onPressedChange" | "onChange" | "pressed"
> &
    VariantProps<typeof toggleVariants> &
    ToggleItemDto & {
        onChange?: (checked: boolean) => void;
    };

type TogglePrimitivVm = {
    item?: ToggleItemFormatted;
};

type ToggleRendererProps = Omit<TogglePrimitiveProps, "onPressedChange" | "contentLayout"> &
    NonNullable<TogglePrimitivVm["item"]> & {
        changeChecked: (checked: boolean) => void;
    };

const ToggleRenderer = ({
    id,
    label,
    icon,
    iconPosition,
    changeChecked,
    className,
    variant,
    size,
    disabled,
    checked
}: ToggleRendererProps) => {
    const contentLayout = useMemo<"text" | "icon">(() => {
        return !label && icon ? "icon" : "text";
    }, [label, icon]);

    return (
        <TogglePrimitives.Root
            id={id}
            pressed={checked}
            className={cn(toggleVariants({ variant, size, contentLayout }), className)}
            disabled={disabled}
            onPressedChange={changeChecked}
        >
            {iconPosition !== "end" && icon}
            {label}
            {iconPosition === "end" && icon}
        </TogglePrimitives.Root>
    );
};

/**
 * Toggle
 */
const DecoratableTogglePrimitive = (props: TogglePrimitiveProps) => {
    const { vm, changeChecked } = useToggle(props);

    if (!vm.item) {
        return null;
    }

    return <ToggleRenderer {...props} {...vm.item} changeChecked={changeChecked} />;
};
const TogglePrimitive = makeDecoratable("TogglePrimitive", DecoratableTogglePrimitive);

export { TogglePrimitive, type TogglePrimitiveProps, type TogglePrimitivVm };
