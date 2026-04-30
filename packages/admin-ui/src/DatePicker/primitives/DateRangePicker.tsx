import React, { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { DateRangePickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";

const DateRangePicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    weekStartsOn,
    onOpenChange,
    className,
    displayFormat
}: DateRangePickerProps) => {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const displayValue = formatDateForDisplay(value, "date-range", displayFormat);

    const handleRangeSelect = (range: DateRange | undefined) => {
        if (onChange) {
            onChange(range ? { from: range.from, to: range.to } : undefined);
        }
    };

    const selected: DateRange | undefined = value?.from
        ? { from: value.from, to: value.to }
        : undefined;

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick a date range"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <Calendar
                        mode="range"
                        selected={selected}
                        onSelect={handleRangeSelect}
                        numberOfMonths={2}
                        weekStartsOn={weekStartsOn}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { DateRangePicker };
