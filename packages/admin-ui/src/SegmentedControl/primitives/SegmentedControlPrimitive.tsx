import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import type { SegmentedControlItemParams, SegmentedControlItemFormatted } from "../domains/index.js";
import { useSegmentedControl } from "./useSegmentedControl.js";

/**
 * Segmented Control Item Button
 */
const segmentedControlItemVariants = cva(
    [
        "inline-flex items-center justify-center whitespace-nowrap transition-colors cursor-pointer relative z-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50"
    ],
    {
        variants: {
            variant: {
                accent: [
                    "text-neutral-strong fill-neutral-xstrong",
                    "data-[state=active]:text-neutral-light data-[state=active]:fill-neutral-base data-[state=active]:bg-primary",
                    "hover:data-[state=inactive]:bg-neutral-dimmed",
                    "active:data-[state=inactive]:bg-neutral-muted"
                ],
                ghost: [
                    "text-neutral-strong fill-neutral-xstrong",
                    "data-[state=active]:text-neutral-light data-[state=active]:fill-neutral-base data-[state=active]:bg-neutral-xstrong",
                    "hover:data-[state=inactive]:bg-neutral-dimmed",
                    "active:data-[state=inactive]:bg-neutral-muted"
                ]
            },
            size: {
                sm: "text-sm px-sm py-xs [&>svg]:size-md gap-xs",
                md: "text-md px-sm-extra py-xs-plus [&>svg]:size-md gap-xs-plus"
            }
        },
        defaultVariants: {
            variant: "accent",
            size: "md"
        }
    }
);

const segmentedControlRootVariants = cva(
    "inline-flex bg-neutral-muted rounded-md p-xs gap-xs",
    {
        variants: {
            variant: {
                accent: "",
                ghost: ""
            }
        },
        defaultVariants: {
            variant: "accent"
        }
    }
);

interface SegmentedControlItemProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
    item: SegmentedControlItemFormatted;
    isActive: boolean;
    onValueChange: (value: string) => void;
    variant?: VariantProps<typeof segmentedControlItemVariants>["variant"];
    size?: VariantProps<typeof segmentedControlItemVariants>["size"];
}

const SegmentedControlItemButton = ({
    item,
    isActive,
    onValueChange,
    variant,
    size,
    className,
    ...props
}: SegmentedControlItemProps) => {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={isActive}
            data-state={isActive ? "active" : "inactive"}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={cn(segmentedControlItemVariants({ variant, size }), "rounded-sm", className)}
            {...props}
        >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            {item.label}
        </button>
    );
};

/**
 * Segmented Control Primitive
 */
interface SegmentedControlPrimitiveProps {
    items: SegmentedControlItemParams[];
    /**
     * Callback triggered when the selected value changes.
     */
    onChange?: (value: string) => void;
    /**
     * The selected value.
     */
    value?: string;
    /**
     * Visual style variant.
     */
    variant?: VariantProps<typeof segmentedControlItemVariants>["variant"];
    /**
     * Size of the control.
     */
    size?: VariantProps<typeof segmentedControlItemVariants>["size"];
    /**
     * Additional class name.
     */
    className?: string;
    /**
     * Disabled state for all items.
     */
    disabled?: boolean;
}

interface SegmentedControlVm {
    items: SegmentedControlItemFormatted[];
}

interface SegmentedControlRendererProps extends SegmentedControlPrimitiveProps {
    items: SegmentedControlItemFormatted[];
    changeValue: (value: string) => void;
}

const SegmentedControlRenderer = ({
    items,
    changeValue,
    value,
    variant = "accent",
    size = "md",
    className,
    disabled
}: SegmentedControlRendererProps) => {
    return (
        <div
            role="radiogroup"
            className={cn(segmentedControlRootVariants({ variant }), className)}
        >
            {items.map(item => (
                <SegmentedControlItemButton
                    key={item.id}
                    item={{ ...item, disabled: disabled || item.disabled }}
                    isActive={value === item.value}
                    onValueChange={changeValue}
                    variant={variant}
                    size={size}
                />
            ))}
        </div>
    );
};

/**
 * Segmented Control Primitive Component
 */
const SegmentedControlPrimitive = (props: SegmentedControlPrimitiveProps) => {
    const { vm, changeValue } = useSegmentedControl(props);
    return <SegmentedControlRenderer {...props} items={vm.items} changeValue={changeValue} />;
};

export {
    SegmentedControlPrimitive,
    SegmentedControlRenderer,
    type SegmentedControlPrimitiveProps,
    type SegmentedControlVm
};

