import * as React from "react";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils";

const textareaVariants = cva(
    [
        "wby-flex wby-min-h-[80px] wby-w-full wby-border-sm wby-text-md focus-visible:wby-outline-none disabled:wby-cursor-not-allowed"
    ],
    {
        variants: {
            variant: {
                primary: [
                    "wby-bg-neutral-base wby-border-neutral-muted wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-border-neutral-strong",
                    "focus:wby-border-neutral-black",
                    "disabled:wby-bg-neutral-disabled disabled:wby-border-neutral-dimmed disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled"
                ],
                secondary: [
                    "wby-bg-neutral-light wby-border-neutral-subtle wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dimmed",
                    "focus:wby-bg-neutral-base focus:wby-border-neutral-black",
                    "disabled:wby-bg-neutral-disabled disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled"
                ],
                ghost: [
                    "wby-bg-transparent wby-border-transparent wby-text-neutral-strong placeholder:wby-text-neutral-dimmed",
                    "hover:wby-bg-neutral-dark/5",
                    "focus:wby-bg-neutral-dark/5",
                    "disabled:wby-bg-transparent disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled"
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
            size: {
                md: ["wby-px-sm-extra wby-py-xs-plus wby-rounded-md"],
                lg: ["wby-px-sm-extra wby-py-sm-plus wby-rounded-md"],
                xl: ["wby-px-md-extra wby-p-md wby-rounded-lg"]
            },
            invalid: {
                true: ""
            }
        },
        compoundVariants: [
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
