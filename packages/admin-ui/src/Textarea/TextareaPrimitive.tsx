import * as React from "react";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";

const textareaVariants = cva(
    [
        "flex min-h-[80px] w-full border-sm text-md focus-visible:outline-none disabled:cursor-not-allowed"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-neutral-base border-neutral-muted text-neutral-strong placeholder:text-neutral-dimmed",
                    "hover:border-neutral-strong",
                    "focus:border-neutral-black",
                    "disabled:bg-neutral-disabled disabled:border-neutral-dimmed disabled:text-neutral-disabled disabled:placeholder:text-neutral-disabled"
                ],
                secondary: [
                    "bg-neutral-light border-neutral-subtle text-neutral-strong placeholder:text-neutral-dimmed",
                    "hover:bg-neutral-dimmed",
                    "focus:bg-neutral-base focus:border-neutral-black",
                    "disabled:bg-neutral-disabled disabled:text-neutral-disabled disabled:placeholder:text-neutral-disabled"
                ],
                ghost: [
                    "bg-transparent border-transparent text-neutral-strong placeholder:text-neutral-dimmed",
                    "hover:bg-neutral-dark/5",
                    "focus:bg-neutral-dark/5",
                    "disabled:bg-transparent disabled:text-neutral-disabled disabled:placeholder:text-neutral-disabled"
                ],
                "ghost-negative": [
                    "bg-transparent border-transparent text-neutral-light/50 placeholder:text-neutral-light/50",
                    "hover:bg-neutral-base/20",
                    "focus:bg-neutral-base focus:text-neutral-primary focus:placeholder:text-neutral-dimmed",
                    "data-[focused=true]:bg-neutral-base data-[focused=true]:bg-neutral-primary data-[focused=true]:placeholder:text-neutral-dimmed",
                    "disabled:bg-transparent disabled:text-neutral-disabled/50 disabled:placeholder:text-neutral-disabled/50",
                    "data-[disabled=true]:bg-transparent data-[disabled=true]:text-neutral-disabled/50 data-[disabled=true]:placeholder:text-neutral-disabled/50"
                ]
            },
            size: {
                md: ["px-sm-extra py-xs-plus rounded-md"],
                lg: ["px-sm-extra py-sm-plus rounded-md"],
                xl: ["px-md-extra p-md rounded-lg"]
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
                class: "border-destructive-subtle! bg-destructive-subtle!"
            },
            {
                variant: "ghost-negative",
                invalid: true,
                class: "!border-destructive-default bg-destructive-subtle! text-neutral-primary placeholder:text-neutral-dimmed"
            }
        ],
        defaultVariants: {
            variant: "primary",
            size: "lg"
        }
    }
);

interface TextareaPrimitiveProps
    extends React.ComponentProps<"textarea">,
        VariantProps<typeof textareaVariants> {
    /**
     * Reference to the textarea element.
     */
    textareaRef?: React.Ref<HTMLTextAreaElement>;

    /**
     * If true, it will pass the native `event` to the `onChange` callback
     */
    forwardEventOnChange?: boolean;

    /**
     * Callback function to be called when the Enter key is pressed.
     */
    onEnter?: () => void;
}

const DecoratableTextareaPrimitive = ({
    className,
    variant,
    invalid,
    size,
    textareaRef,
    forwardEventOnChange,
    onChange: originalOnChange,
    onEnter,
    onKeyDown: originalOnKeyDown,
    value,
    ...props
}: TextareaPrimitiveProps) => {
    const onChange = React.useCallback(
        (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
            if (!originalOnChange) {
                return;
            }

            // @ts-expect-error
            originalOnChange(forwardEventOnChange ? event : event.target.value);
        },
        [forwardEventOnChange, originalOnChange]
    );

    const onKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        <textarea
            {...props}
            ref={textareaRef}
            className={cn(textareaVariants({ variant, invalid, size }), className)}
            onChange={onChange}
            onKeyDown={onKeyDown}
            value={value ?? ""}
        />
    );
};

const TextareaPrimitive = makeDecoratable("TextareaPrimitive", DecoratableTextareaPrimitive);

export { TextareaPrimitive, type TextareaPrimitiveProps };
