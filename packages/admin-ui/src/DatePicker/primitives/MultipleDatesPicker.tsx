import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { MultipleDatesPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { SelectedTagsList } from "./components/SelectedTagsList.js";

const MultipleDatesPicker = ({
    value = [],
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
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        onOpenChange?.(isOpen);
    };

    const displayValue = formatDateForDisplay(value, "multiple-dates");

    const handleSelect = (dates: Date[] | undefined) => {
        onChange?.(dates ?? []);
    };

    const handleRemove = (key: string) => {
        onChange?.(value.filter(d => d.toISOString() !== key));
    };

    const tagItems = value.map(d => ({
        key: d.toISOString(),
        label: format(d, "MMM d, yyyy")
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
                        selected={value}
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
