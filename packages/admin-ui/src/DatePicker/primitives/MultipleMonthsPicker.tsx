import React, { useState } from "react";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { MultipleMonthsPickerProps } from "../utils/types.js";
import { formatDateForDisplay, formatMonthValue, parseMonthValue } from "../utils/dateHelpers.js";
import { MONTH_NAMES_SHORT } from "../utils/constants.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { YearStepper } from "./components/YearStepper.js";
import { MonthGrid } from "./components/MonthGrid.js";
import { SelectedTagsList } from "./components/SelectedTagsList.js";

const MultipleMonthsPicker = ({
    value = [],
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    onOpenChange,
    className
}: MultipleMonthsPickerProps) => {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        onOpenChange?.(isOpen);
    };

    const displayValue = formatDateForDisplay(value, "multiple-months");

    const handleMonthSelect = (month: number) => {
        const monthValue = formatMonthValue(viewYear, month);
        if (value.includes(monthValue)) {
            onChange?.(value.filter(v => v !== monthValue));
        } else {
            onChange?.([...value, monthValue]);
        }
    };

    const handleRemove = (key: string) => {
        onChange?.(value.filter(v => v !== key));
    };

    const selectedMonthsInView = value
        .map(v => parseMonthValue(v))
        .filter((p): p is { year: number; month: number } => p !== undefined && p.year === viewYear)
        .map(p => p.month);

    const tagItems = value.map(v => {
        const parsed = parseMonthValue(v);
        const label = parsed ? `${MONTH_NAMES_SHORT[parsed.month]} ${parsed.year}` : v;
        return { key: v, label };
    });

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick months"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <YearStepper year={viewYear} onYearChange={setViewYear} />
                    <MonthGrid
                        selectedMonths={selectedMonthsInView}
                        onSelectMonth={handleMonthSelect}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
            <SelectedTagsList items={tagItems} onRemove={handleRemove} disabled={disabled} />
        </div>
    );
};

export { MultipleMonthsPicker };
