import * as React from "react";
import type { Icon as BaseIcon } from "~/Icon/index.js";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";

interface InputIconProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ReactElement;
    inputSize?: VariantProps<typeof inputVariants>["size"];
}

const InputIcon = ({ icon, inputSize, className }: InputIconProps) => {
    return (
        <div className={cn("fill-inherit", className)}>
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
        "relative flex items-center gap-sm w-full",
        "border-sm text-md",
        "has-disabled:cursor-not-allowed data-[disabled=true]:cursor-not-allowed"
    ],
    {
        variants: {
            size: {
                md: [
                    "rounded-md",
                    "py-[calc(var(--padding-xs-plus)-(var(--border-width-sm)))] px-[calc(var(--padding-sm-extra)-(var(--border-width-sm)))]"
                ],
                lg: [
                    "rounded-md",
                    "py-[calc(var(--padding-sm-plus)-(var(--border-width-sm)))] px-[calc(var(--padding-sm-extra)-(var(--border-width-sm)))]"
                ],
                xl: [
                    "rounded-lg leading-6",
                    "py-[calc(var(--padding-md)-(var(--border-width-sm)))] px-[calc(var(--padding-md)-(var(--border-width-sm)))]"
                ]
            },
            variant: {
                primary: [
                    "bg-neutral-base border-neutral-muted text-neutral-strong placeholder:text-neutral-dimmed fill-neutral-xstrong",
                    "hover:border-neutral-strong",
                    "focus-within:!border-neutral-black",
                    "data-[focused=true]:!border-neutral-black",
                    "has-disabled:bg-neutral-disabled has-disabled:border-neutral-muted has-disabled:hover:border-neutral-muted has-disabled:text-neutral-disabled has-disabled:placeholder:text-neutral-disabled has-disabled:fill-neutral-disabled",
                    "data-[disabled=true]:bg-neutral-disabled data-[disabled=true]:border-neutral-muted data-[disabled=true]:text-neutral-disabled data-[disabled=true]:placeholder:text-neutral-disabled data-[disabled=true]:fill-neutral-disabled"
                ],
                secondary: [
                    "bg-neutral-light border-neutral-subtle text-neutral-strong placeholder:text-neutral-dimmed fill-neutral-xstrong",
                    "hover:bg-neutral-dimmed",
                    "focus-within:bg-neutral-base! focus-within:!border-neutral-black",
                    "data-[focused=true]:bg-neutral-base! data-[focused=true]:!border-neutral-black",
                    "has-disabled:bg-neutral-disabled has-disabled:text-neutral-disabled has-disabled:placeholder:text-neutral-disabled has-disabled:fill-neutral-disabled",
                    "data-[disabled=true]:bg-neutral-disabled data-[disabled=true]:text-neutral-disabled data-[disabled=true]:placeholder:text-neutral-disabled data-[disabled=true]:fill-neutral-disabled"
                ],
                ghost: [
                    "bg-transparent border-transparent text-neutral-strong placeholder:text-neutral-dimmed",
                    "hover:bg-neutral-dark/5",
                    "focus-within:bg-neutral-dark/5!",
                    "data-[focused=true]:bg-neutral-dark/5!",
                    "has-disabled:bg-transparent has-disabled:text-neutral-disabled has-disabled:placeholder:text-neutral-disabled has-disabled:fill-neutral-disabled",
                    "data-[disabled=true]:bg-transparent data-[disabled=true]:text-neutral-disabled data-[disabled=true]:placeholder:text-neutral-disabled data-[disabled=true]:fill-neutral-disabled"
                ],
                "ghost-negative": [
                    "bg-transparent border-transparent text-neutral-light/50 placeholder:text-neutral-light/50 fill-neutral-base/50",
                    "hover:bg-neutral-base/20",
                    "focus-within:bg-neutral-base! focus-within:text-neutral-primary! focus-within:!placeholder:text-neutral-dimmed focus-within:fill-neutral-xstrong!",
                    "data-[focused=true]:bg-neutral-base! data-[focused=true]:text-neutral-primary! data-[focused=true]:!placeholder:text-neutral-dimmed data-[focused=true]:fill-neutral-xstrong!",
                    "has-disabled:bg-transparent has-disabled:text-neutral-disabled/50 has-disabled:placeholder:text-neutral-disabled/50",
                    "data-[disabled=true]:bg-transparent data-[disabled=true]:text-neutral-disabled/50 data-[disabled=true]:placeholder:text-neutral-disabled/50"
                ]
            },
            invalid: {
                true: ""
            }
        },
        compoundVariants: [
            // Add specific classNames in case of invalid inputs: note the difference between the ghost and the other variants.
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
                class: "border-destructive-subtle! bg-destructive-subtle!"
            },
            {
                variant: "ghost-negative",
                invalid: true,
                class: "!border-destructive-default bg-destructive-subtle! text-neutral-primary placeholder:text-neutral-dimmed fill-neutral-xstrong!"
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
        <div className={cn(inputVariants({ variant, size, invalid }), className)}>
            {startIcon && <InputIcon icon={startIcon} />}
            <input
                {...props}
                ref={inputRef}
                className={cn([
                    "w-full bg-transparent border-none text-md peer",
                    "focus-visible:outline-none",
                    "disabled:cursor-not-allowed",
                    "file:text-sm file:font-semibold"
                ])}
                disabled={disabled}
                size={maxLength}
                onChange={onChange}
                onKeyDown={onKeyDown}
                value={value ?? ""}
                onFocus={onFocus}
            />
            {endIcon && <InputIcon icon={endIcon} />}
        </div>
    );
};

const InputPrimitive = makeDecoratable("InputPrimitive", DecoratableInputPrimitive);

export { InputIcon, InputPrimitive, inputVariants, type InputIconProps, type InputPrimitiveProps };
