import * as React from "react";
import { Icon as BaseIcon } from "~/Icon";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils";

/**
 * Icon
 */
const inputIconVariants = cva("wby-absolute wby-fill-neutral-xstrong", {
    variants: {
        // Define dummy variants to be used in combination with `compoundVariants` below.
        inputSize: {
            md: "wby-top-sm",
            lg: "wby-top-sm-extra",
            xl: "wby-top-md"
        },
        position: {
            start: "",
            end: ""
        },
        disabled: {
            true: "wby-fill-neutral-disabled"
        }
    },
    defaultVariants: {
        inputSize: "lg",
        position: "start"
    },
    compoundVariants: [
        // The icon position is `absolute` and is adjusted horizontally across its parent using left and right.
        {
            inputSize: "md",
            position: "start",
            class: "wby-left-[calc(theme(spacing.sm-plus)-theme(borderWidth.sm))]"
        },
        {
            inputSize: "md",
            position: "end",
            class: "wby-right-[calc(theme(spacing.sm-plus)-theme(borderWidth.sm))]"
        },
        {
            inputSize: "lg",
            position: "start",
            class: "wby-left-[calc(theme(spacing.sm-plus)-theme(borderWidth.sm))]"
        },
        {
            inputSize: "lg",
            position: "end",
            class: "wby-right-[calc(theme(spacing.sm-plus)-theme(borderWidth.sm))]"
        },
        {
            inputSize: "xl",
            position: "start",
            class: "wby-left-[calc(theme(spacing.md)-theme(borderWidth.sm))]"
        },
        {
            inputSize: "xl",
            position: "end",
            class: "wby-right-[calc(theme(spacing.md)-theme(borderWidth.sm))]"
        }
    ]
});

interface InputIconProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof inputIconVariants> {
    icon: React.ReactElement;
}

const InputIcon = ({ icon, disabled, position, inputSize, className }: InputIconProps) => {
    return (
        <div className={cn(inputIconVariants({ position, disabled, inputSize }), className)}>
            {React.cloneElement(icon, {
                ...icon.props,
                size: inputSize === "xl" ? "lg" : "sm" // Map icon size based on the input size.
            })}
        </div>
    );
};

/**
 * Input
 *
 * We support both `disabled` and `data-disabled` as well as `focused` and `data-focused` variants
 * because these variants can be used by both input and div elements. The last one is used by `MultiAutocomplete` component,
 * where the `inputVariants` is used to style a div that wraps multiple elements (input, Tags, icons, etc.)
 */
const inputVariants = cva(
    [
        "wby-w-full wby-border-sm wby-text-md wby-peer",
        "focus-visible:wby-outline-none",
        "disabled:wby-cursor-not-allowed data-[disabled=true]:wby-cursor-not-allowed",
        "file:wby-bg-transparent file:wby-border-none file:wby-text-sm file:wby-font-semibold"
    ],
    {
        variants: {
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
            variant: {
                primary: [
                    "wby-bg-neutral-base wby-border-neutral-muted wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-border-neutral-strong",
                    "focus:wby-border-neutral-black",
                    "data-[focused=true]:wby-border-neutral-black",
                    "disabled:wby-bg-neutral-disabled disabled:wby-border-neutral-dimmed disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled",
                    "data-[disabled=true]:wby-bg-neutral-disabled data-[disabled=true]:wby-border-neutral-dimmed data-[disabled=true]:wby-text-neutral-disabled data-[disabled=true]:placeholder:wby-text-neutral-disabled"
                ],
                secondary: [
                    "wby-bg-neutral-light wby-border-neutral-subtle wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dimmed",
                    "focus:wby-bg-neutral-base focus:wby-border-neutral-black",
                    "data-[focused=true]:wby-bg-neutral-base data-[focused=true]:wby-border-neutral-black",
                    "disabled:wby-bg-neutral-disabled disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled",
                    "data-[disabled=true]:wby-bg-neutral-disabled data-[disabled=true]:wby-text-neutral-disabled data-[disabled=true]:placeholder:wby-text-neutral-disabled"
                ],
                ghost: [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dark/5",
                    "focus:wby-bg-neutral-dark/5",
                    "data-[focused=true]:wby-bg-neutral-dark/5",
                    "disabled:wby-bg-transparent disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled",
                    "data-[disabled=true]:wby-bg-transparent data-[disabled=true]:wby-text-neutral-disabled data-[disabled=true]:placeholder:wby-text-neutral-disabled"
                ],
                "ghost-negative": [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-light/50 placeholder:wby-text-neutral-light/50",
                    "hover:wby-bg-neutral-base/20",
                    "focus:wby-bg-neutral-base focus:wby-text-neutral-primary focus:placeholder:wby-text-neutral-dimmed",
                    "data-[focused=true]:wby-bg-neutral-base data-[focused=true]:wby-bg-neutral-primary data-[focused=true]:placeholder:wby-text-neutral-dimmed",
                    "disabled:wby-bg-transparent disabled:wby-text-neutral-disabled/50 disabled:placeholder:wby-text-neutral-disabled/50",
                    "data-[disabled=true]:wby-bg-transparent data-[disabled=true]:wby-text-neutral-disabled/50 data-[disabled=true]:placeholder:wby-text-neutral-disabled/50"
                ]
            },
            iconPosition: {
                start: "wby-pl-[calc(theme(padding.xl)-theme(borderWidth.sm))]",
                end: "wby-pr-[calc(theme(padding.xl)-theme(borderWidth.sm))]",
                both: [
                    "wby-pl-[calc(theme(padding.xl)-theme(borderWidth.sm))]",
                    "wby-pr-[calc(theme(padding.xl)-theme(borderWidth.sm))]"
                ]
            },
            invalid: {
                true: ""
            }
        },
        compoundVariants: [
            // Prevent text overlap with icons, add extra padding for icons.
            {
                size: "lg",
                iconPosition: "start",
                class: "wby-pl-[calc(theme(padding.xl)-theme(borderWidth.sm))]"
            },
            {
                size: "lg",
                iconPosition: "end",
                class: "wby-pr-[calc(theme(padding.xl)-theme(borderWidth.sm))]"
            },
            {
                size: "lg",
                iconPosition: "both",
                class: [
                    "wby-pl-[calc(theme(padding.xl)-theme(borderWidth.sm))]",
                    "wby-pr-[calc(theme(padding.xl)-theme(borderWidth.sm))]"
                ]
            },
            {
                size: "xl",
                iconPosition: "start",
                class: "wby-pl-[calc(theme(padding.xxl)+theme(padding.xs)-theme(borderWidth.sm))]"
            },
            {
                size: "xl",
                iconPosition: "end",
                class: "wby-pr-[calc(theme(padding.xxl)+theme(padding.xs)-theme(borderWidth.sm))]"
            },
            {
                size: "xl",
                iconPosition: "both",
                class: [
                    "wby-pl-[calc(theme(padding.xxl)+theme(padding.xs)-theme(borderWidth.sm))]",
                    "wby-pr-[calc(theme(padding.xxl)+theme(padding.xs)-theme(borderWidth.sm))]"
                ]
            },
            // Add specific classNames in case of invalid inputs: note the difference between the ghost and the other variants.
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
                class: "!wby-border-destructive-default !wby-bg-destructive-subtle wby-text-neutral-primary placeholder:wby-text-neutral-dimmed"
            }
        ],
        defaultVariants: {
            size: "lg",
            variant: "primary"
        }
    }
);

type InputPrimitiveProps<TValue = any> = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange"
> &
    VariantProps<typeof inputVariants> & {
        /**
         * Icon to be displayed at the start of the input field.
         */
        startIcon?: React.ReactElement<typeof BaseIcon> | React.ReactElement;
        /**
         * Icon to be displayed at the end of the input field.
         */
        endIcon?: React.ReactElement<typeof BaseIcon> | React.ReactElement;
        /**
         * Maximum length of the input field.
         */
        maxLength?: React.InputHTMLAttributes<HTMLInputElement>["size"];
        /**
         * Reference to the input element.
         */
        inputRef?: React.Ref<HTMLInputElement>;
        /**
         * If true, it will pass the native `event` to the `onChange` callback
         */
        forwardEventOnChange?: boolean;
        /**
         * Callback function to be called when the Enter key is pressed.
         */
        onEnter?: InputPrimitiveProps["onKeyDown"];
        /**
         * Callback function to be called when the Esc key is pressed.
         */
        onEscape?: InputPrimitiveProps["onKeyDown"];
        /**
         * A callback that is executed each time a value is changed.
         */
        onChange?: (value: TValue) => void;
        /**
         * If true, will select the value in the input on focus.
         */
        autoSelect?: boolean;
    };

const getIconPosition = (
    startIcon?: InputPrimitiveProps["startIcon"],
    endIcon?: InputPrimitiveProps["endIcon"]
): "start" | "end" | "both" | undefined => {
    if (startIcon && endIcon) {
        return "both";
    }
    if (startIcon) {
        return "start";
    }
    if (endIcon) {
        return "end";
    }
    return;
};

const DecoratableInputPrimitive = ({
    autoSelect,
    className,
    disabled,
    endIcon,
    forwardEventOnChange,
    inputRef,
    invalid,
    maxLength,
    onChange: originalOnChange,
    onEnter,
    onEscape,
    onKeyDown: originalOnKeyDown,
    onFocus: originalOnFocus,
    size,
    startIcon,
    value,
    variant,
    ...props
}: InputPrimitiveProps) => {
    const iconPosition = getIconPosition(startIcon, endIcon);

    const onChange = React.useCallback(
        (event: React.SyntheticEvent<HTMLInputElement>) => {
            if (!originalOnChange) {
                return;
            }

            // @ts-expect-error
            originalOnChange(forwardEventOnChange ? event : event.target.value);
        },
        [forwardEventOnChange, originalOnChange]
    );

    const onKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (typeof onEnter === "function" && e.key === "Enter") {
                onEnter(e);
            }

            if (typeof onEscape === "function" && e.key === "Escape") {
                onEscape(e);
            }

            if (typeof originalOnKeyDown === "function") {
                return originalOnKeyDown(e);
            }
        },
        [originalOnKeyDown, onEnter]
    );

    const onFocus = React.useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            if (originalOnFocus) {
                originalOnFocus(e);
            }

            if (autoSelect) {
                e.target.select();
            }
        },
        [originalOnFocus, autoSelect]
    );

    return (
        <div className={cn("wby-relative wby-flex wby-items-center wby-w-full", className)}>
            {startIcon && (
                <InputIcon
                    disabled={disabled}
                    icon={startIcon}
                    inputSize={size}
                    position={"start"}
                />
            )}
            <input
                {...props}
                ref={inputRef}
                className={cn(inputVariants({ variant, size, iconPosition, invalid }))}
                disabled={disabled}
                size={maxLength}
                onChange={onChange}
                onKeyDown={onKeyDown}
                value={value ?? ""}
                onFocus={onFocus}
            />
            {endIcon && (
                <InputIcon disabled={disabled} icon={endIcon} inputSize={size} position={"end"} />
            )}
        </div>
    );
};

const InputPrimitive = makeDecoratable("InputPrimitive", DecoratableInputPrimitive);

export {
    InputIcon,
    InputPrimitive,
    getIconPosition,
    inputVariants,
    inputIconVariants,
    type InputIconProps,
    type InputPrimitiveProps
};
