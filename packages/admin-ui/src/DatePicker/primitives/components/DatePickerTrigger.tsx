import React, { forwardRef } from "react";
import { ReactComponent as CalendarMonthIcon } from "@webiny/icons/calendar_month.svg";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/schedule.svg";
import { Icon } from "~/Icon/index.js";
import { inputVariants, type InputPrimitiveProps } from "~/Input/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import { cn } from "~/utils.js";

interface DatePickerTriggerProps {
    displayValue?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: InputPrimitiveProps["size"];
    variant?: InputPrimitiveProps["variant"];
    invalid?: InputPrimitiveProps["invalid"];
    iconType?: "calendar" | "time";
}

const DatePickerTriggerInner = forwardRef<
    HTMLDivElement,
    DatePickerTriggerProps & React.HTMLAttributes<HTMLDivElement>
>(
    (
        {
            displayValue,
            placeholder,
            disabled,
            size,
            variant,
            invalid,
            iconType = "calendar",
            className,
            ...props
        },
        ref
    ) => {
        const IconComponent = iconType === "time" ? ScheduleIcon : CalendarMonthIcon;
        const iconLabel = iconType === "time" ? "Time" : "Calendar";

        return (
            <PopoverPrimitive.Trigger asChild>
                <div
                    ref={ref}
                    role="button"
                    tabIndex={0}
                    data-disabled={disabled}
                    className={cn(
                        inputVariants({ size, variant, invalid }),
                        "cursor-pointer justify-between select-none",
                        disabled && "pointer-events-none opacity-50",
                        className
                    )}
                    {...props}
                >
                    <span className={cn("truncate", !displayValue && "text-neutral-dimmed")}>
                        {displayValue || placeholder || "Select..."}
                    </span>
                    <Icon icon={<IconComponent />} label={iconLabel} size="sm" color="inherit" />
                </div>
            </PopoverPrimitive.Trigger>
        );
    }
);

DatePickerTriggerInner.displayName = "DatePickerTrigger";

export { DatePickerTriggerInner as DatePickerTrigger, type DatePickerTriggerProps };
