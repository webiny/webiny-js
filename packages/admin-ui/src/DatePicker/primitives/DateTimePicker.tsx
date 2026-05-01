import React, { useState } from "react";
import { format } from "date-fns";
import { UTC_TIMEZONES } from "@webiny/utils";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import { SelectPrimitive } from "~/Select/index.js";
import type { DateTimeLocalPickerProps, DateTimeTzPickerProps } from "../utils/types.js";
import {
    extractTimezone,
    formatDateForDisplay,
    formatTimeValue,
    getLocalTimezone,
    parseTimeValue,
    toIsoWithTz
} from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { TimePicker } from "./components/TimePicker.js";

type DateTimePickerInternalProps = (DateTimeLocalPickerProps | DateTimeTzPickerProps) & {
    withTimezone: boolean;
};

const timezoneOptions = UTC_TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }));

function parseToDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return undefined;
    }
    return d;
}

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

    const existingTz = withTimezone && value ? extractTimezone(value as string) : undefined;
    const [timezone, setTimezone] = useState(existingTz || getLocalTimezone());

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const currentDate = parseToDate(value);

    const displayValue = withTimezone
        ? formatDateForDisplay(value, "dateTimeTz", displayFormat)
        : formatDateForDisplay(value, "dateTimeLocal", displayFormat);

    const timeValue = currentDate ? formatTimeValue(currentDate) : "";

    const emitChange = (date: Date, tz?: string) => {
        if (!onChange) {
            return;
        }
        if (withTimezone) {
            onChange(toIsoWithTz(date, tz || timezone));
        } else {
            onChange(format(date, "yyyy-MM-dd'T'HH:mm:ss"));
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

    const handleTimezoneChange = (tz: string) => {
        setTimezone(tz);
        if (currentDate) {
            emitChange(currentDate, tz);
        }
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
                        <div className="flex gap-sm px-md pb-md">
                            <div className="flex-1">
                                <TimePicker
                                    value={timeValue}
                                    onChange={handleTimeChange}
                                    disabled={disabled}
                                    size="md"
                                />
                            </div>
                            {withTimezone && (
                                <div className="flex-1">
                                    <SelectPrimitive
                                        value={timezone}
                                        onChange={handleTimezoneChange}
                                        options={timezoneOptions}
                                        disabled={disabled}
                                        size="md"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { DateTimePicker };
