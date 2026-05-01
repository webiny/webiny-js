import React, { useState } from "react";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { MultipleYearsPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { YearGrid } from "./components/YearGrid.js";
import { SelectedTagsList } from "./components/SelectedTagsList.js";

const MultipleYearsPicker = ({
    value: valueProp,
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
    const value = valueProp ?? [];
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const displayValue = formatDateForDisplay(value, "multipleYears");

    const handleYearSelect = (year: number) => {
        if (!onChange) {
            return;
        }
        if (value.includes(year)) {
            onChange(value.filter(v => v !== year));
        } else {
            const next = [...value, year];
            next.sort((a, b) => a - b);
            onChange(next);
        }
    };

    const handleRemove = (key: string) => {
        if (onChange) {
            onChange(value.filter(v => String(v) !== key));
        }
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
