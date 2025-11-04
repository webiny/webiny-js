import * as React from "react";
import { ReactComponent as ImageIcon } from "@webiny/icons/image.svg";
import { cn, cva, type VariantProps } from "~/utils.js";
import type { TriggerDefaultProps } from "~/FilePicker/primitives/components/types.js";
import { Icon } from "~/Icon/index.js";
import { Text } from "~/Text/index.js";

const triggerVariants = cva(
    [
        "w-full flex items-center justify-center",
        "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-neutral-disabled",
        "focus-visible:outline-none  focus-visible:ring-primary-dimmed",
        "text-neutral-strong data-[disabled=true]:text-neutral-disabled",
        "fill-neutral-strong data-[disabled=true]:fill-neutral-disabled"
    ],
    {
        variants: {
            type: {
                area: "px-xs py-md-extra rounded-md focus-visible:ring-lg",
                compact: "px-sm py-xs rounded-sm focus-visible:ring-md"
            },
            variant: {
                primary: ["bg-neutral-subtle", "hover:bg-neutral-light"],
                secondary: ["bg-neutral-base", "hover:bg-neutral-base"],
                ghost: ["bg-neutral-subtle", "hover:bg-neutral-light"]
            }
        },
        compoundVariants: [
            // Combination of `type = area` and different `variant`
            {
                type: "area",
                variant: "primary",
                className: ["bg-neutral-subtle", "hover:bg-neutral-light"]
            },
            {
                type: "area",
                variant: "secondary",
                className: ["bg-neutral-base", "hover:bg-neutral-base"]
            },
            {
                type: "area",
                variant: "ghost",
                className: [
                    "bg-neutral-subtle",
                    "hover:bg-neutral-light",
                    "data-[disabled=true]:bg-neutral-base"
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
            <span className={"inline-flex items-center justify-center whitespace-nowrap gap-xs"}>
                <Icon icon={<ImageIcon />} label={label} color={"inherit"} />
                <Text size={"sm"} className={"leading-none"}>
                    {label}
                </Text>
            </span>
        </button>
    );
};

export { Trigger, type TriggerProps, triggerVariants };
