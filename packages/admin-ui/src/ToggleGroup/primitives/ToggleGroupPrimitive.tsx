import * as React from "react";
import { useMemo } from "react";
import { ToggleGroup as ToggleGroupPrimitives } from "radix-ui";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";
import { useToggleGroup } from "./useToggleGroup.js";
import type { ToggleGroupItemFormatted, ToggleGroupItemParams } from "../domains/index.js";

/**
 * Toggle Group Item
 */

const toggleGroupItemVariants = cva(
    [
        "border-sm inline-flex items-center justify-center gap-xs whitespace-nowrap font-sans cursor-pointer transition-colors rounded-sm",
        "focus-visible:outline-none focus-visible:border-accent-default focus-visible:ring-lg focus-visible:ring-primary-dimmed",
        "disabled:pointer-events-none disabled:opacity-50"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "border-transparent bg-neutral-dimmed text-neutral-strong fill-neutral-strong",
                    "hover:bg-neutral-muted",
                    "data-[state=on]:bg-neutral-xstrong data-[state=on]:text-neutral-light data-[state=on]:fill-neutral-light"
                ],
                outline: [
                    "border-neutral-dimmed-darker bg-neutral-base text-neutral-strong fill-neutral-strong",
                    "hover:bg-neutral-light",
                    "data-[state=on]:bg-neutral-dimmed"
                ],
                ghost: [
                    "border-transparent bg-transparent text-neutral-strong fill-neutral-strong",
                    "hover:bg-neutral-dimmed",
                    "data-[state=on]:bg-neutral-muted"
                ],
                "ghost-negative": [
                    "border-transparent bg-transparent text-neutral-light fill-neutral-light",
                    "hover:bg-neutral-base/20",
                    "data-[state=on]:bg-neutral-base/30"
                ]
            },
            size: {
                sm: [
                    "text-sm [&>svg]:size-md",
                    "py-[calc(var(--padding-xs)-(var(--border-width-sm)))] px-[calc(var(--padding-sm)-(var(--border-width-sm)))]"
                ],
                md: [
                    "text-md [&>svg]:size-md",
                    "py-[calc(var(--padding-xs-plus)-(var(--border-width-sm)))] px-[calc(var(--padding-sm-extra)-(var(--border-width-sm)))]"
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
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "md"
        }
    }
);

/**
 * Toggle Group Container
 */

const toggleGroupVariants = cva("inline-flex items-center", {
    variants: {
        bordered: {
            true: "rounded-md border-sm border-neutral-dimmed-darker p-[calc(var(--padding-xs)-(var(--border-width-sm)))]",
            false: ""
        },
        variant: {
            primary: "gap-xs",
            outline: "gap-xs",
            ghost: "",
            "ghost-negative": ""
        }
    },
    defaultVariants: {
        bordered: false,
        variant: "primary"
    }
});

type ToggleGroupVariant = VariantProps<typeof toggleGroupItemVariants>["variant"];
type ToggleGroupSize = VariantProps<typeof toggleGroupItemVariants>["size"];

type ToggleGroupSingleProps = {
    type?: "single";
    value?: string;
    onChange?: (value: string) => void;
};

type ToggleGroupMultipleProps = {
    type: "multiple";
    value?: string[];
    onChange?: (value: string[]) => void;
};

type ToggleGroupPrimitiveBaseProps = {
    items: ToggleGroupItemParams[];
    variant?: ToggleGroupVariant;
    size?: ToggleGroupSize;
    bordered?: boolean;
    disabled?: boolean;
    className?: string;
};

type ToggleGroupPrimitiveProps = ToggleGroupPrimitiveBaseProps &
    (ToggleGroupSingleProps | ToggleGroupMultipleProps);

type ToggleGroupVm = {
    items: ToggleGroupItemFormatted[];
};

/**
 * Toggle Group Renderer
 */

type ToggleGroupRendererProps = ToggleGroupPrimitiveProps & {
    items: ToggleGroupItemFormatted[];
    changeValue: (value: string | string[]) => void;
};

const ToggleGroupRenderer = ({
    items,
    changeValue,
    value,
    type = "single",
    variant = "primary",
    size = "md",
    bordered = false,
    disabled,
    className
}: ToggleGroupRendererProps) => {
    const containerClass = cn(toggleGroupVariants({ bordered, variant }), className);

    const radixProps = useMemo(() => {
        if (type === "multiple") {
            return {
                type: "multiple" as const,
                value: (value as string[] | undefined) ?? [],
                onValueChange: changeValue as (value: string[]) => void
            };
        }
        return {
            type: "single" as const,
            value: (value as string | undefined) ?? "",
            onValueChange: changeValue as (value: string) => void
        };
    }, [type, value, changeValue]);

    return (
        <ToggleGroupPrimitives.Root {...radixProps} disabled={disabled} className={containerClass}>
            {items.map(item => {
                const contentLayout = !item.label && item.icon ? "icon" : "text";
                return (
                    <ToggleGroupPrimitives.Item
                        key={item.id}
                        value={item.value}
                        disabled={item.disabled}
                        className={cn(toggleGroupItemVariants({ variant, size, contentLayout }))}
                    >
                        {item.iconPosition !== "end" && item.icon}
                        {item.label}
                        {item.iconPosition === "end" && item.icon}
                    </ToggleGroupPrimitives.Item>
                );
            })}
        </ToggleGroupPrimitives.Root>
    );
};

/**
 * Toggle Group Primitive
 */

const DecoratableToggleGroupPrimitive = (props: ToggleGroupPrimitiveProps) => {
    const { vm, changeValue } = useToggleGroup(props);
    return <ToggleGroupRenderer {...props} items={vm.items} changeValue={changeValue} />;
};

const ToggleGroupPrimitive = makeDecoratable(
    "ToggleGroupPrimitive",
    DecoratableToggleGroupPrimitive
);

export {
    ToggleGroupPrimitive,
    type ToggleGroupPrimitiveProps,
    type ToggleGroupVm,
    type ToggleGroupVariant,
    type ToggleGroupSize
};
