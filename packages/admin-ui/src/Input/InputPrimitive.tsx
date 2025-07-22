import * as React from "react";
import { Icon as BaseIcon } from "~/Icon";
import { cn, cva, type VariantProps, makeDecoratable } from "~/utils";

interface InputIconProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ReactElement;
    inputSize?: VariantProps<typeof inputVariants>["size"];
}

const InputIcon = ({ icon, inputSize, className }: InputIconProps) => {
    return (
        <div className={cn("wby-fill-inherit", className)}>
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
        "wby-relative wby-flex wby-items-center wby-gap-sm wby-w-full",
        "wby-border-sm wby-text-md",
        "has-[:disabled]:wby-cursor-not-allowed data-[disabled=true]:wby-cursor-not-allowed"
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
                    "wby-bg-neutral-base wby-border-neutral-muted wby-text-neutral-strong placeholder:wby-text-neutral-dimmed wby-fill-neutral-xstrong",
                    "hover:wby-border-neutral-strong",
                    "focus-within:!wby-border-neutral-black",
                    "data-[focused=true]:!wby-border-neutral-black",
                    "has-[:disabled]:wby-bg-neutral-disabled has-[:disabled]:wby-border-neutral-muted has-[:disabled]:hover:wby-border-neutral-muted has-[:disabled]:wby-text-neutral-disabled has-[:disabled]:placeholder:wby-text-neutral-disabled has-[:disabled]:wby-fill-neutral-disabled",
                    "data-[disabled=true]:wby-bg-neutral-disabled data-[disabled=true]:wby-border-neutral-muted data-[disabled=true]:wby-text-neutral-disabled data-[disabled=true]:placeholder:wby-text-neutral-disabled data-[disabled=true]:wby-fill-neutral-disabled"
                ],
                secondary: [
                    "wby-bg-neutral-light wby-border-neutral-subtle wby-text-neutral-strong placeholder:wby-text-neutral-dimmed wby-fill-neutral-xstrong",
                    "hover:wby-bg-neutral-dimmed",
                    "focus-within:!wby-bg-neutral-base focus-within:!wby-border-neutral-black",
                    "data-[focused=true]:!wby-bg-neutral-base data-[focused=true]:!wby-border-neutral-black",
                    "has-[:disabled]:wby-bg-neutral-disabled has-[:disabled]:wby-text-neutral-disabled has-[:disabled]:placeholder:wby-text-neutral-disabled has-[:disabled]:wby-fill-neutral-disabled",
                    "data-[disabled=true]:wby-bg-neutral-disabled data-[disabled=true]:wby-text-neutral-disabled data-[disabled=true]:placeholder:wby-text-neutral-disabled data-[disabled=true]:wby-fill-neutral-disabled"
                ],
                ghost: [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dark/5",
                    "focus-within:!wby-bg-neutral-dark/5",
                    "data-[focused=true]:!wby-bg-neutral-dark/5",
                    "has-[:disabled]:wby-bg-transparent has-[:disabled]:wby-text-neutral-disabled has-[:disabled]:placeholder:wby-text-neutral-disabled has-[:disabled]:wby-fill-neutral-disabled",
                    "data-[disabled=true]:wby-bg-transparent data-[disabled=true]:wby-text-neutral-disabled data-[disabled=true]:placeholder:wby-text-neutral-disabled data-[disabled=true]:wby-fill-neutral-disabled"
                ],
                "ghost-negative": [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-light/50 placeholder:wby-text-neutral-light/50 wby-fill-neutral-base/50",
                    "hover:wby-bg-neutral-base/20",
                    "focus-within:!wby-bg-neutral-base focus-within:!wby-text-neutral-primary focus-within:!placeholder:wby-text-neutral-dimmed focus-within:!wby-fill-neutral-xstrong",
                    "data-[focused=true]:!wby-bg-neutral-base data-[focused=true]:!wby-text-neutral-primary data-[focused=true]:!placeholder:wby-text-neutral-dimmed data-[focused=true]:!wby-fill-neutral-xstrong",
                    "has-[:disabled]:wby-bg-transparent has-[:disabled]:wby-text-neutral-disabled/50 has-[:disabled]:placeholder:wby-text-neutral-disabled/50",
                    "data-[disabled=true]:wby-bg-transparent data-[disabled=true]:wby-text-neutral-disabled/50 data-[disabled=true]:placeholder:wby-text-neutral-disabled/50"
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
        onEnter?: () => void;
        /**
         * A callback that is executed each time a value is changed.
         */
        onChange?: (value: TValue) => void;
    };

const DecoratableInputPrimitive = ({
    className,
    disabled,
    endIcon,
    forwardEventOnChange,
    inputRef,
    invalid,
    maxLength,
    onChange: originalOnChange,
    onEnter,
    onKeyDown: originalOnKeyDown,
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
                onEnter();
            }

            if (typeof originalOnKeyDown === "function") {
                return originalOnKeyDown(e);
            }
        },
        [originalOnKeyDown, onEnter]
    );

    return (
        <div className={cn(inputVariants({ variant, size, invalid }), className)}>
            {startIcon && <InputIcon icon={startIcon} />}
            <input
                {...props}
                ref={inputRef}
                className={cn([
                    "wby-w-full wby-bg-transparent wby-border-none wby-text-md wby-peer",
                    "focus-visible:wby-outline-none",
                    "disabled:wby-cursor-not-allowed",
                    "file:wby-text-sm file:wby-font-semibold"
                ])}
                disabled={disabled}
                size={maxLength}
                onChange={onChange}
                onKeyDown={onKeyDown}
                value={value ?? ""}
            />
            {endIcon && <InputIcon icon={endIcon} />}
        </div>
    );
};

const InputPrimitive = makeDecoratable("InputPrimitive", DecoratableInputPrimitive);

export { InputIcon, InputPrimitive, inputVariants, type InputIconProps, type InputPrimitiveProps };
