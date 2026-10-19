import React, { useState } from "react";
import { format } from "date-fns";
import type { Matcher } from "react-day-picker";
import { Button } from "~/Button/index.js";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { DateOnlyPickerProps } from "../utils/types.js";
import { formatDateForDisplay, parseDateValue } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";

const DateOnlyPicker = ({
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
    presets,
    displayFormat,
    minDate,
    maxDate
}: DateOnlyPickerProps) => {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const handlePresetClick = (computeDate: () => Date) => {
        if (onChange) {
            onChange(format(computeDate(), "yyyy-MM-dd"));
        }
        handleOpenChange(false);
    };

    const displayValue = formatDateForDisplay(value, "date", displayFormat);
    const selectedDate = value ? parseDateValue(value) : undefined;

    // The days outside minDate and maxDate cannot be picked, as in DateTimePicker.
    const disabledDays: Matcher[] = [];
    if (minDate) {
        disabledDays.push({ before: minDate });
    }
    if (maxDate) {
        disabledDays.push({ after: maxDate });
    }

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick a date"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <div className={presets?.length ? "flex" : undefined}>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={date => {
                                if (onChange) {
                                    onChange(date ? format(date, "yyyy-MM-dd") : undefined);
                                }
                                handleOpenChange(false);
                            }}
                            weekStartsOn={weekStartsOn}
                            disabled={disabledDays}
                        />
                        {presets && presets.length > 0 && (
                            <div className="flex flex-col gap-xs border-l-sm border-neutral-muted p-sm min-w-[130px]">
                                {presets.map(preset => {
                                    const presetDate = format(preset.value(), "yyyy-MM-dd");
                                    return (
                                        <Button
                                            key={preset.label}
                                            variant={value === presetDate ? "primary" : "ghost"}
                                            size="sm"
                                            text={preset.label}
                                            onClick={() => handlePresetClick(preset.value)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { DateOnlyPicker };
