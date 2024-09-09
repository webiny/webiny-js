import * as React from "react";
import { ReactComponent as CheckIcon } from "@material-design-icons/svg/outlined/check.svg";
import { ReactComponent as ChevronDownIcon } from "@material-design-icons/svg/outlined/keyboard_arrow_down.svg";
import { ReactComponent as ChevronUpIcon } from "@material-design-icons/svg/outlined/keyboard_arrow_up.svg";
import * as SelectPrimitive from "@radix-ui/react-select";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, generateId } from "~/utils";
import { Icon } from "~/Icon";

/**
 * Select Trigger
 */
const selectTriggerVariants = cva(
    "flex w-full items-center justify-between rounded-md bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    {
        variants: {
            size: {
                md: "h-10 text-sm",
                lg: "h-20 text-lg"
            },
            variant: {
                outline: "border border-input",
                ghost: ""
            }
        },
        defaultVariants: {
            size: "md",
            variant: "outline"
        }
    }
);

type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
    VariantProps<typeof selectTriggerVariants> & {
        icon?: React.ReactElement<typeof Icon>;
        placeholder?: string;
    };

const SelectTriggerBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    SelectTriggerProps
>(({ className, icon, placeholder, size, variant, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(selectTriggerVariants({ size, variant }), className)}
        {...props}
    >
        {icon}
        <SelectPrimitive.SelectValue placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
));
SelectTriggerBase.displayName = SelectPrimitive.Trigger.displayName;

const SelectTrigger = makeDecoratable("SelectTrigger", SelectTriggerBase);

/**
 * Select Scroll Up Button
 */
const SelectScrollUpButtonBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn("flex cursor-default items-center justify-center py-1", className)}
        {...props}
    >
        <ChevronUpIcon className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButtonBase.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollUpButton = makeDecoratable("SelectScrollUpButton", SelectScrollUpButtonBase);

/**
 * Select Scroll Down Button
 */
const SelectScrollDownButtonBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn("flex cursor-default items-center justify-center py-1", className)}
        {...props}
    >
        <ChevronDownIcon className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButtonBase.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectScrollDownButton = makeDecoratable(
    "SelectScrollDownButton",
    SelectScrollDownButtonBase
);

/**
 * Select Content
 */
const SelectContentBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                position === "popper" &&
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                className
            )}
            position={position}
            {...props}
        >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport
                className={cn(
                    "p-1",
                    position === "popper" &&
                        "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SelectContentBase.displayName = SelectPrimitive.Content.displayName;

const SelectContent = makeDecoratable("SelectContent", SelectContentBase);

/**
 * Select label
 */
const SelectLabelBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
        {...props}
    />
));
SelectLabelBase.displayName = SelectPrimitive.Label.displayName;

const SelectLabel = makeDecoratable("SelectLabel", SelectLabelBase);

/**
 * Select Item
 */
const SelectItemBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, disabled, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        disabled={disabled}
        className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <CheckIcon className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>
    </SelectPrimitive.Item>
));
SelectItemBase.displayName = SelectPrimitive.Item.displayName;

const SelectItem = makeDecoratable("SelectItem", SelectItemBase);

/**
 * Select Separator
 */
const SelectSeparatorBase = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
));
SelectSeparatorBase.displayName = SelectPrimitive.Separator.displayName;

const SelectSeparator = makeDecoratable("SelectSeparator", SelectSeparatorBase);

/**
 * Select
 */
interface BaseOption extends Omit<React.AllHTMLAttributes<any>, "label"> {
    label: React.ReactNode;
    disabled?: boolean;
}

interface OptionWithValue extends BaseOption {
    value: string;
    options?: never;
}

interface OptionWithOptions extends BaseOption {
    options: OptionWithValue[];
    value?: never;
}

type FormattedOption = OptionWithValue | OptionWithOptions;

interface SelectProps extends Omit<SelectPrimitive.SelectProps, "children"> {
    icon?: SelectTriggerProps["icon"];
    options?: string[] | FormattedOption[];
    placeholder?: SelectTriggerProps["placeholder"];
    size?: SelectTriggerProps["size"];
    variant?: SelectTriggerProps["variant"];
}

const SelectBase = ({
    icon,
    placeholder,
    options: initialOptions,
    size,
    variant,
    ...props
}: SelectProps) => {
    const options = React.useMemo(() => {
        if (!initialOptions) {
            return [];
        }

        const options: FormattedOption[] = [];
        for (const option of initialOptions) {
            if (typeof option === "string") {
                options.push({
                    label: option,
                    value: option
                });
                continue;
            }

            if (option.options) {
                options.push({
                    label: option.label,
                    options: option.options
                });
                continue;
            }

            options.push({
                label: option.label,
                value: option.value,
                disabled: option.disabled
            });
        }

        return options;
    }, [initialOptions]);

    const renderOption = React.useCallback(
        ({ label, value, disabled }: OptionWithValue) => {
            return (
                <SelectItem key={generateId()} value={value} disabled={disabled}>
                    {label}
                </SelectItem>
            );
        },
        [options]
    );

    const renderGroup = React.useCallback(
        ({ label, options, showSeparator }: OptionWithOptions & { showSeparator: boolean }) => {
            return (
                <SelectPrimitive.SelectGroup key={generateId()}>
                    <SelectLabel>{label}</SelectLabel>
                    {options.map(({ label, value, disabled }) =>
                        renderOption({
                            label,
                            value,
                            disabled
                        })
                    )}
                    {showSeparator && <SelectSeparator />}
                </SelectPrimitive.SelectGroup>
            );
        },
        [options]
    );

    return (
        <SelectPrimitive.Root {...props}>
            <SelectTrigger icon={icon} placeholder={placeholder} size={size} variant={variant} />
            <SelectContent>
                {!!options &&
                    options.map(
                        (
                            { label, value, disabled, options: childOptions }: FormattedOption,
                            index
                        ) => {
                            console.log("index", index);
                            console.log("options.length", options.length);

                            if (childOptions) {
                                return renderGroup({
                                    label,
                                    options: childOptions,
                                    showSeparator: index !== options.length - 1
                                });
                            }

                            return renderOption({
                                label,
                                value,
                                disabled
                            });
                        }
                    )}
            </SelectContent>
        </SelectPrimitive.Root>
    );
};

const Select = makeDecoratable("Select", SelectBase);

export { type SelectProps, Select };
