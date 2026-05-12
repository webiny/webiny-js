import React, { useCallback, useMemo } from "react";
import { Popover } from "radix-ui";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { cn, makeDecoratable, type VariantProps } from "~/utils.js";
import { CheckboxPrimitiveRenderer } from "~/Checkbox/index.js";
import { Icon } from "~/Icon/index.js";
import { IconButton } from "~/Button/index.js";
import { selectTriggerVariants } from "~/Select/primitives/components/index.js";

interface MultiSelectOptionDto {
    label: string;
    value: string;
    disabled?: boolean;
}

interface MultiSelectPrimitiveProps {
    options?: MultiSelectOptionDto[];
    value?: string[];
    onChange?: (values: string[]) => void;
    onValueReset?: () => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    displayResetAction?: boolean;
    /**
     * When `true`, shows "{count} items selected" in the trigger instead of the comma-separated
     * label list. Pass a function for a custom message: `count => \`${count} files included\``
     */
    selectionLabel?: boolean | ((count: number) => string);
    size?: VariantProps<typeof selectTriggerVariants>["size"];
    variant?: VariantProps<typeof selectTriggerVariants>["variant"];
}

/**
 * MultiSelect Trigger
 */
interface MultiSelectTriggerProps {
    displayValue: string;
    hasValue: boolean;
    placeholder: string;
    displayResetAction: boolean;
    disabled?: boolean;
    invalid?: VariantProps<typeof selectTriggerVariants>["invalid"];
    size?: VariantProps<typeof selectTriggerVariants>["size"];
    variant?: VariantProps<typeof selectTriggerVariants>["variant"];
    onValueReset: () => void;
}

const MultiSelectTrigger = ({
    displayValue,
    hasValue,
    placeholder,
    displayResetAction,
    disabled,
    invalid,
    size,
    variant,
    onValueReset
}: MultiSelectTriggerProps) => {
    const resetButton = useMemo(() => {
        if (!hasValue || !displayResetAction) {
            return undefined;
        }
        return (
            <IconButton
                onPointerDown={event => {
                    event.stopPropagation();
                    onValueReset();
                }}
                icon={
                    <span>
                        <Icon
                            icon={<Close />}
                            label={"Reset"}
                            color={variant === "ghost-negative" ? "neutral-negative" : "inherit"}
                        />
                    </span>
                }
                size={"xs"}
                variant={variant === "ghost-negative" ? "ghost-negative" : "secondary"}
                disabled={disabled}
                asChild
            />
        );
    }, [hasValue, displayResetAction, onValueReset, variant, disabled]);

    return (
        <Popover.Trigger
            className={cn(selectTriggerVariants({ variant, size, invalid }))}
            disabled={disabled}
        >
            <div className={"flex-1 text-left truncate"}>
                {hasValue ? (
                    displayValue
                ) : (
                    <span className={"text-neutral-disabled"}>{placeholder}</span>
                )}
            </div>
            {resetButton}
            <span className={"h-md w-md shrink-0 fill-neutral-xstrong"}>
                <ChevronDown className={"h-md w-md"} />
            </span>
        </Popover.Trigger>
    );
};

/**
 * MultiSelect Content
 */
interface MultiSelectContentProps {
    options: MultiSelectOptionDto[];
    value: string[];
    onToggle: (value: string) => void;
}

const MultiSelectContent = ({ options, value, onToggle }: MultiSelectContentProps) => {
    return (
        <Popover.Portal>
            <Popover.Content
                className={cn(
                    "relative z-popover shadow-lg py-sm overflow-y-auto rounded-sm border-sm border-neutral-muted bg-neutral-base text-neutral-strong",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                    "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
                )}
                style={{
                    width: "var(--radix-popover-trigger-width)",
                    maxHeight: "var(--radix-popover-content-available-height, 24rem)"
                }}
                align={"start"}
                sideOffset={4}
            >
                {options.map(option => (
                    <div
                        key={option.value}
                        className={cn(
                            "rounded-sm p-sm mx-sm cursor-pointer",
                            "hover:bg-neutral-dimmed",
                            option.disabled && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => onToggle(option.value)}
                    >
                        <div className={"pointer-events-none"}>
                            <CheckboxPrimitiveRenderer
                                id={option.value}
                                label={option.label}
                                value={option.value}
                                checked={value.includes(option.value)}
                                disabled={option.disabled ?? false}
                                indeterminate={false}
                                hasLabel={true}
                                changeChecked={() => {}}
                            />
                        </div>
                    </div>
                ))}
            </Popover.Content>
        </Popover.Portal>
    );
};

/**
 * MultiSelect Primitive
 */
const DecoratableMultiSelectPrimitive = ({
    options = [],
    value = [],
    onChange,
    onValueReset,
    placeholder = "Select options",
    disabled,
    invalid,
    displayResetAction = true,
    selectionLabel,
    size,
    variant
}: MultiSelectPrimitiveProps) => {
    const displayValue = useMemo(() => {
        if (value.length === 0) return "";
        if (selectionLabel === true) return `${value.length} items selected`;
        if (typeof selectionLabel === "function") return selectionLabel(value.length);
        const labelMap = new Map(options.map(o => [o.value, o.label]));
        return value.map(v => labelMap.get(v) ?? v).join(", ");
    }, [value, options, selectionLabel]);

    const toggle = useCallback(
        (optionValue: string) => {
            const next = value.includes(optionValue)
                ? value.filter(v => v !== optionValue)
                : [...value, optionValue];
            onChange?.(next);
        },
        [value, onChange]
    );

    const reset = useCallback(() => {
        onChange?.([]);
        onValueReset?.();
    }, [onChange, onValueReset]);

    return (
        <Popover.Root>
            <MultiSelectTrigger
                displayValue={displayValue}
                hasValue={value.length > 0}
                placeholder={placeholder}
                displayResetAction={displayResetAction}
                disabled={disabled}
                invalid={invalid}
                size={size}
                variant={variant}
                onValueReset={reset}
            />
            <MultiSelectContent options={options} value={value} onToggle={toggle} />
        </Popover.Root>
    );
};
const MultiSelectPrimitive = makeDecoratable(
    "MultiSelectPrimitive",
    DecoratableMultiSelectPrimitive
);

export { MultiSelectPrimitive, type MultiSelectPrimitiveProps, type MultiSelectOptionDto };
