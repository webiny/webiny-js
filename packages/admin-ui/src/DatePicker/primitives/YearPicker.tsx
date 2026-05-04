import React, { useState } from "react";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { YearPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { YearGrid } from "./components/YearGrid.js";

const YearPicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    yearRange,
    onOpenChange,
    className
}: YearPickerProps) => {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const displayValue = formatDateForDisplay(value, "year");

    const handleYearSelect = (year: number) => {
        if (onChange) {
            onChange(year);
        }
        handleOpenChange(false);
    };

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick a year"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <YearGrid
                        selectedYears={value !== undefined ? [value] : []}
                        onSelectYear={handleYearSelect}
                        yearRange={yearRange}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { YearPicker };
