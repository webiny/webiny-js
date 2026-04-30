import React, { useState } from "react";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { DateTimeLocalPickerProps, DateTimeTzPickerProps } from "../utils/types.js";
import {
    formatDateForDisplay,
    formatTimeValue,
    parseTimeValue,
    toIsoWithTz,
    toLocalNaive
} from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { TimePicker } from "./components/TimePicker.js";

type DateTimePickerInternalProps = (DateTimeLocalPickerProps | DateTimeTzPickerProps) & {
    withTimezone: boolean;
};

const DateTimePicker = ({
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
    withTimezone,
    displayFormat
}: DateTimePickerInternalProps) => {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const currentDate: Date | undefined = withTimezone
        ? value
            ? toLocalNaive(value as string)
            : undefined
        : (value as Date | undefined);

    const displayValue = withTimezone
        ? formatDateForDisplay(value, "datetime-tz", displayFormat)
        : formatDateForDisplay(value, "datetime-local", displayFormat);

    const timeValue = currentDate ? formatTimeValue(currentDate) : "";

    const emitChange = (date: Date) => {
        if (!onChange) {
            return;
        }
        if (withTimezone) {
            (onChange as (v: string | undefined) => void)(toIsoWithTz(date));
        } else {
            (onChange as (v: Date | undefined) => void)(date);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            return;
        }
        if (currentDate) {
            date.setHours(currentDate.getHours(), currentDate.getMinutes());
        }
        emitChange(date);
    };

    const handleTimeChange = (time: string | undefined) => {
        if (!time) {
            return;
        }
        const parsed = parseTimeValue(time);
        if (!parsed) {
            return;
        }
        const base = currentDate ? new Date(currentDate) : new Date();
        base.setHours(parsed.hours, parsed.minutes, 0, 0);
        emitChange(base);
    };

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick date & time"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <div className="flex flex-col gap-sm">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={handleDateSelect}
                            weekStartsOn={weekStartsOn}
                        />
                        <div className="px-md pb-md">
                            <TimePicker
                                value={timeValue}
                                onChange={handleTimeChange}
                                disabled={disabled}
                                size="md"
                            />
                        </div>
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { DateTimePicker };
