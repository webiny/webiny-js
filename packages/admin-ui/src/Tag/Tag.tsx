import * as React from "react";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";
import { Icon, type IconProps } from "~/Icon/index.js";
import type { iconButtonVariants } from "~/Button/index.js";
import { IconButton } from "~/Button/index.js";

const tagVariants = cva(
    [
        "inline-flex items-center gap-xxs rounded-sm text-sm text-regular transition-colors overflow-hidden",
        "focus:outline-none"
    ],
    {
        variants: {
            isInteractive: {
                true: "cursor-pointer"
            },
            isDismissible: {
                true: "pl-xs-plus pt-xxs pb-xxs pr-xs",
                false: "px-xs-plus py-xxs"
            },
            isDisabled: {
                true: "cursor-not-allowed pointer-events-none"
            },
            variant: {
                "neutral-base": [
                    "bg-transparent text-neutral-primary",
                    "hover:bg-neutral-light",
                    "aria-disabled:bg-transparent aria-disabled:text-neutral-disabled"
                ],
                "neutral-base-outline": [
                    "border-sm border-solid px-[calc(var(--padding-xs-plus)-(var(--border-width-sm)))] py-[calc(var(--padding-xxs)-(var(--border-width-sm)))]",
                    "bg-transparent border-neutral-muted text-neutral-primary",
                    "hover:bg-neutral-light",
                    "aria-disabled:bg-transparent aria-disabled:border-neutral-dimmed aria-disabled:text-neutral-disabled"
                ],
                "neutral-light": [
                    "bg-neutral-light text-neutral-primary",
                    "hover:bg-neutral-muted",
                    "aria-disabled:bg-neutral-light aria-disabled:text-neutral-muted"
                ],
                "neutral-muted": [
                    "bg-neutral-muted text-neutral-primary",
                    "hover:bg-neutral-strong",
                    "aria-disabled:bg-neutral-muted aria-disabled:text-neutral-muted"
                ],
                "neutral-strong": [
                    "bg-neutral-strong text-neutral-light",
                    "hover:bg-neutral-xstrong",
                    "aria-disabled:bg-neutral-muted"
                ],
                "neutral-xstrong": [
                    "bg-neutral-xstrong text-neutral-light",
                    "hover:bg-neutral-dark",
                    "aria-disabled:bg-neutral-strong"
                ],
                "neutral-dark": [
                    "bg-neutral-dark text-neutral-light",
                    "hover:bg-neutral-xstrong",
                    "aria-disabled:bg-neutral-strong"
                ],
                accent: [
                    "bg-primary text-neutral-light",
                    "hover:bg-primary-strong",
                    "aria-disabled:bg-primary-disabled"
                ],
                "accent-light": [
                    "bg-primary-subtle text-neutral-primary",
                    "hover:bg-primary-muted",
                    "aria-disabled:bg-primary-subtle aria-disabled:text-neutral-muted"
                ],
                success: [
                    "bg-success-default text-neutral-light",
                    "hover:bg-success-strong",
                    "aria-disabled:bg-success-disabled"
                ],
                "success-light": [
                    "bg-success-subtle text-neutral-primary",
                    "hover:bg-success-muted",
                    "aria-disabled:bg-success-subtle aria-disabled:text-neutral-muted"
                ],
                warning: [
                    "bg-warning-muted text-neutral-primary",
                    "hover:bg-warning-default",
                    "aria-disabled:bg-warning-disabled aria-disabled:text-neutral-disabled"
                ],
                destructive: [
                    "bg-destructive-default text-neutral-light",
                    "hover:bg-destructive-strong",
                    "aria-disabled:bg-destructive-disabled"
                ]
            }
        },
        defaultVariants: {
            variant: "neutral-base"
        }
    }
);

export interface TagProps
    extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children" | "content">,
        VariantProps<typeof tagVariants> {
    content: React.ReactNode;
    onDismiss?: (event: React.SyntheticEvent<HTMLSpanElement>) => void;
    dismissIconElement?: React.ReactElement;
    dismissIconLabel?: string;
    disabled?: boolean;
}

const DecoratableTag = ({
    className,
    variant,
    content,
    onClick,
    onDismiss,
    dismissIconElement = <Close />,
    dismissIconLabel = "Close",
    disabled,
    ...props
}: TagProps) => {
    const dismissButtonVariant = React.useMemo((): VariantProps<
        typeof iconButtonVariants
    >["variant"] => {
        if (
            variant &&
            [
                "neutral-strong",
                "neutral-xstrong",
                "neutral-dark",
                "success",
                "accent",
                "destructive"
            ].includes(variant)
        ) {
            return "ghost-negative";
        }

        return "ghost";
    }, [variant]);

    const dismissIconColor: IconProps["color"] = React.useMemo(() => {
        if (
            variant &&
            [
                "neutral-strong",
                "neutral-xstrong",
                "neutral-dark",
                "accent",
                "success",
                "destructive"
            ].includes(variant)
        ) {
            return "neutral-negative";
        }

        if (variant && ["warning"].includes(variant)) {
            return "neutral-strong";
        }

        return "neutral-strong-transparent";
    }, [variant]);

    return (
        <span
            {...props}
            onClick={onClick}
            className={cn(
                tagVariants({
                    variant,
                    isDismissible: Boolean(onDismiss),
                    isInteractive: Boolean(onClick),
                    isDisabled: Boolean(disabled)
                }),
                className
            )}
            aria-disabled={disabled}
        >
            <span className={"overflow-hidden truncate whitespace-nowrap"}>{content}</span>
            {onDismiss && (
                <IconButton
                    icon={
                        <Icon
                            icon={dismissIconElement}
                            label={dismissIconLabel}
                            color={dismissIconColor}
                            size={"sm"}
                        />
                    }
                    size={"xxs"}
                    variant={dismissButtonVariant}
                    disabled={disabled}
                    onClick={event => {
                        event.stopPropagation();
                        onDismiss(event);
                    }}
                />
            )}
        </span>
    );
};
const Tag = makeDecoratable("Tag", DecoratableTag);

export { Tag };
