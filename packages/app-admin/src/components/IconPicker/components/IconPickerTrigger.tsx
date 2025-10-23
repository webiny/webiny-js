import React from "react";
import { ReactComponent as EmptyIcon } from "@webiny/icons/remove.svg";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { cn, cva, Icon as IconComponent, inputVariants, type VariantProps } from "@webiny/admin-ui";
import { IconProvider, IconRenderer } from "~/components/IconPicker/IconRenderer.js";
import type { Icon } from "~/components/IconPicker/types.js";

const iconPickerTriggerVariants = cva("cursor-pointer fill-neutral-xstrong", {
    variants: {
        size: {
            md: "w-[64px]",
            lg: "w-[64px]",
            xl: "w-[76px]"
        },
        disabled: {
            true: "pointer-events-none"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

interface IconPickerTriggerProps
    extends VariantProps<typeof inputVariants>,
        VariantProps<typeof iconPickerTriggerVariants> {
    icon: Icon | null;
    disabled?: boolean;
}

const IconPickerTrigger = (props: IconPickerTriggerProps) => {
    return (
        <div
            data-disabled={props.disabled}
            className={cn(
                inputVariants({
                    size: props.size,
                    variant: props.variant,
                    invalid: props.invalid
                }),
                iconPickerTriggerVariants({ size: props.size, disabled: props.disabled })
            )}
        >
            <div className={"flex items-center gap-xs"}>
                <div>
                    {props.icon ? (
                        <IconProvider icon={props.icon} size={24}>
                            <IconComponent icon={<IconRenderer />} label={props.icon.name} />
                        </IconProvider>
                    ) : (
                        <IconComponent icon={<EmptyIcon />} label={"Search icons"} size={"lg"} />
                    )}
                </div>
                <div>
                    <IconComponent size={"sm"} icon={<ChevronDown />} label={"Open list"} />
                </div>
            </div>
        </div>
    );
};

export { IconPickerTrigger, type IconPickerTriggerProps };
