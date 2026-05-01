import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { MultipleDatesPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { SelectedTagsList } from "./components/SelectedTagsList.js";

const toDateStr = (d: Date) => format(d, "yyyy-MM-dd");

const MultipleDatesPicker = ({
    value: valueProp,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    weekStartsOn,
    onOpenChange,
    className
}: MultipleDatesPickerProps) => {
    const value = valueProp ?? [];
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const displayValue = formatDateForDisplay(value, "multipleDates");

    const selectedDates = value.map(s => new Date(s));

    const handleSelect = (dates: Date[] | undefined) => {
        if (onChange) {
            const sorted = [...(dates ?? [])].sort((a, b) => a.getTime() - b.getTime());
            onChange(sorted.map(toDateStr));
        }
    };

    const handleRemove = (key: string) => {
        if (onChange) {
            onChange(value.filter(d => d !== key));
        }
    };

    const tagItems = value.map(d => ({
        key: d,
        label: format(new Date(d), "MMM d, yyyy")
    }));

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick dates"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={handleSelect}
                        weekStartsOn={weekStartsOn}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
            <SelectedTagsList items={tagItems} onRemove={handleRemove} disabled={disabled} />
        </div>
    );
};

export { MultipleDatesPicker };
