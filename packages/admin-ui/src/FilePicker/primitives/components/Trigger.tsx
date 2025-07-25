import * as React from "react";
import { ReactComponent as ImageIcon } from "@webiny/icons/image.svg";
import { cn, cva, type VariantProps } from "~/utils";
import type { TriggerDefaultProps } from "~/FilePicker/primitives/components/types";
import { Icon } from "~/Icon";
import { Text } from "~/Text";

const triggerVariants = cva(
    [
        "wby-w-full wby-flex wby-items-center wby-justify-center",
        "data-[disabled=true]:wby-cursor-not-allowed data-[disabled=true]:wby-bg-neutral-disabled",
        "focus-visible:wby-outline-none  focus-visible:wby-ring-primary-dimmed",
        "wby-text-neutral-strong data-[disabled=true]:wby-text-neutral-disabled",
        "wby-fill-neutral-strong data-[disabled=true]:wby-fill-neutral-disabled"
    ],
    {
        variants: {
            type: {
                area: "wby-px-xs wby-py-md-extra wby-rounded-md focus-visible:wby-ring-lg",
                compact: "wby-px-sm wby-py-xs wby-rounded-sm focus-visible:wby-ring-md"
            },
            variant: {
                primary: ["wby-bg-neutral-subtle", "hover:wby-bg-neutral-light"],
                secondary: ["wby-bg-neutral-base", "hover:wby-bg-neutral-base"],
                ghost: ["wby-bg-neutral-subtle", "hover:wby-bg-neutral-light"]
            }
        },
        compoundVariants: [
            // Combination of `type = area` and different `variant`
            {
                type: "area",
                variant: "primary",
                className: ["wby-bg-neutral-subtle", "hover:wby-bg-neutral-light"]
            },
            {
                type: "area",
                variant: "secondary",
                className: ["wby-bg-neutral-base", "hover:wby-bg-neutral-base"]
            },
            {
                type: "area",
                variant: "ghost",
                className: [
                    "wby-bg-neutral-subtle",
                    "hover:wby-bg-neutral-light",
                    "data-[disabled=true]:wby-bg-neutral-base"
                ]
            }
        ],
        defaultVariants: {
            type: "area",
            variant: "primary"
        }
    }
);

interface TriggerProps extends TriggerDefaultProps, VariantProps<typeof triggerVariants> {
    renderTrigger?: (props: any) => React.ReactElement<any>;
}

const Trigger = ({
    renderTrigger,
    type,
    variant,
    text,
    className,
    disabled,
    onSelectItem,
    ...props
}: TriggerProps) => {
    if (typeof renderTrigger === "function") {
        return renderTrigger({ disabled, text, onSelectItem, ...props });
    }

    const label = text ?? "Select from library";

    return (
        <button
            data-role={"select-image"}
            data-disabled={disabled}
            disabled={disabled}
            onClick={onSelectItem}
            className={cn(triggerVariants({ type, variant }), className)}
            {...props}
        >
            <span
                className={
                    "wby-inline-flex wby-items-center wby-justify-center wby-whitespace-nowrap wby-gap-xs"
                }
            >
                <Icon icon={<ImageIcon />} label={label} color={"inherit"} />
                <Text size={"sm"} className={"wby-leading-none"}>
                    {label}
                </Text>
            </span>
        </button>
    );
};

export { Trigger, type TriggerProps, triggerVariants };
