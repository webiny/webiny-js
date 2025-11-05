import React from "react";
import { cn, cva, type VariantProps } from "@webiny/admin-ui";
import type { Icon } from "~/components/IconPicker/index.js";
import { IconProvider, IconRenderer } from "~/components/IconPicker/IconRenderer.js";

const iconPickerCellVariants = cva(
    [
        "flex justify-center items-center",
        "rounded-md cursor-pointer size-xl p-xs",
        "hover:bg-neutral-dimmed transition-all duration-500 ease-out"
    ],
    {
        variants: {
            isActive: {
                true: "bg-neutral-dimmed"
            }
        }
    }
);

interface IconPickerCellProps extends VariantProps<typeof iconPickerCellVariants> {
    icon: Icon;
    onIconClick: (icon: Icon) => void;
}

const IconPickerCell = ({ isActive, icon, onIconClick }: IconPickerCellProps) => {
    return (
        <div className={cn(iconPickerCellVariants({ isActive }))} onClick={() => onIconClick(icon)}>
            <IconProvider icon={icon}>
                <IconRenderer />
            </IconProvider>
        </div>
    );
};

export { IconPickerCell, type IconPickerCellProps };
