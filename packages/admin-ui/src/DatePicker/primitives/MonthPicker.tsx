import React, { useState } from "react";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { MonthPickerProps } from "../utils/types.js";
import { formatDateForDisplay, formatMonthValue, parseMonthValue } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { YearStepper } from "./components/YearStepper.js";
import { MonthGrid } from "./components/MonthGrid.js";

const MonthPicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    onOpenChange,
    className,
    displayFormat
}: MonthPickerProps) => {
    const parsed = value ? parseMonthValue(value) : undefined;
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        onOpenChange?.(isOpen);
    };

    const displayValue = formatDateForDisplay(value, "month", displayFormat);

    const handleMonthSelect = (month: number) => {
        onChange?.(formatMonthValue(viewYear, month));
        handleOpenChange(false);
    };

    const selectedMonths = parsed && parsed.year === viewYear ? [parsed.month] : [];

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick a month"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <YearStepper year={viewYear} onYearChange={setViewYear} />
                    <MonthGrid selectedMonths={selectedMonths} onSelectMonth={handleMonthSelect} />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { MonthPicker };
