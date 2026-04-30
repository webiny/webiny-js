import React, { useState } from "react";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { MultipleYearsPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { YearGrid } from "./components/YearGrid.js";
import { SelectedTagsList } from "./components/SelectedTagsList.js";

const MultipleYearsPicker = ({
    value = [],
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    yearRange,
    onOpenChange,
    className
}: MultipleYearsPickerProps) => {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        onOpenChange?.(isOpen);
    };

    const displayValue = formatDateForDisplay(value, "multiple-years");

    const handleYearSelect = (year: number) => {
        if (value.includes(year)) {
            onChange?.(value.filter(v => v !== year));
        } else {
            onChange?.([...value, year]);
        }
    };

    const handleRemove = (key: string) => {
        onChange?.(value.filter(v => String(v) !== key));
    };

    const tagItems = value.map(y => ({
        key: String(y),
        label: String(y)
    }));

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick years"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <YearGrid
                        selectedYears={value}
                        onSelectYear={handleYearSelect}
                        yearRange={yearRange}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
            <SelectedTagsList items={tagItems} onRemove={handleRemove} disabled={disabled} />
        </div>
    );
};

export { MultipleYearsPicker };
