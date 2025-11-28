import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import type {
    SegmentedControlItemParams,
    SegmentedControlItemFormatted
} from "../domains/index.js";
import { useSegmentedControl } from "./useSegmentedControl.js";
import { Icon } from "~/Icon/index.js";

/**
 * Segmented Control Item Button
 */
const segmentedControlItemVariants = cva(
    [
        "inline-flex items-center justify-center whitespace-nowrap transition-colors cursor-pointer relative z-10 rounded-md",
        "text-md px-sm-extra py-xs [&>svg]:size-md gap-xs",
        "focus-visible:outline-none focus-visible:ring-md focus-visible:ring-primary-dimmed focus-visible:ring-offset-0",
        "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
    ],
    {
        variants: {
            variant: {
                accent: [
                    "text-neutral-strong fill-neutral-xstrong",
                    "data-[state=active]:text-neutral-primary data-[state=active]:fill-neutral-xstrong data-[state=active]:bg-neutral-base/80",
                    "hover:data-[state=inactive]:bg-neutral-base/80",
                    "active:data-[state=inactive]:bg-neutral-muted"
                ],
                ghost: [
                    "text-neutral-strong fill-neutral-xstrong",
                    "data-[state=active]:bg-neutral-dark/5",
                    "hover:data-[state=inactive]:bg-neutral-dark/5",
                    "active:data-[state=inactive]:bg-neutral-dark/5"
                ]
            }
        },
        defaultVariants: {
            variant: "accent"
        }
    }
);

const segmentedControlRootVariants = cva("inline-flex rounded-md p-xxs gap-xs", {
    variants: {
        variant: {
            accent: "bg-neutral-light",
            ghost: ""
        }
    },
    defaultVariants: {
        variant: "accent"
    }
});

interface SegmentedControlItemProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
    item: SegmentedControlItemFormatted;
    isActive: boolean;
    onValueChange: (value: string) => void;
    variant?: VariantProps<typeof segmentedControlItemVariants>["variant"];
}

const SegmentedControlItemButton = ({
    item,
    isActive,
    onValueChange,
    variant,
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
            className={cn(segmentedControlItemVariants({ variant }), className)}
            {...props}
        >
            {item.icon && (
                <Icon
                    icon={item.icon}
                    size={"sm"}
                    label={String(item.label)}
                    color={"neutral-strong"}
                />
            )}
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
    className,
    disabled
}: SegmentedControlRendererProps) => {
    return (
        <div role="radiogroup" className={cn(segmentedControlRootVariants({ variant }), className)}>
            {items.map(item => (
                <SegmentedControlItemButton
                    key={item.id}
                    item={{ ...item, disabled: disabled || item.disabled }}
                    isActive={value === item.value}
                    onValueChange={changeValue}
                    variant={variant}
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
