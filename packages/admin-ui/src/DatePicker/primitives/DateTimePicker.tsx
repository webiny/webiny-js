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
    parseTimeValue
} from "../utils/dateHelpers.js";
import { naiveDateToUtcIso, parseToDate, utcToTimezoneDate } from "../utils/timezoneHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";
import { TimePicker } from "./components/TimePicker.js";

type DateTimePickerInternalProps = (DateTimeLocalPickerProps | DateTimeTzPickerProps) & {
    withTimezone: boolean;
};

const timezoneOptions = UTC_TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }));

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
    displayFormat,
    minDate,
    maxDate
}: DateTimePickerInternalProps) => {
    const [open, setOpen] = useState(false);

    const existingTz = withTimezone && value ? extractTimezone(value) : undefined;
    const [timezone, setTimezone] = useState(existingTz || getLocalTimezone());

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const currentDate = parseToDate(value);

    const displayDate =
        withTimezone && currentDate ? utcToTimezoneDate(currentDate, timezone) : currentDate;

    const displayValue = withTimezone
        ? displayDate
            ? formatDateForDisplay(
                  format(displayDate, "yyyy-MM-dd'T'HH:mm:ss") + timezone,
                  "dateTimeTz",
                  displayFormat
              )
            : undefined
        : formatDateForDisplay(value, "dateTimeLocal", displayFormat);

    const timeValue = displayDate ? formatTimeValue(displayDate) : "";

    const emitChange = (date: Date, tz?: string) => {
        if (!onChange) {
            return;
        }
        if (withTimezone) {
            onChange(naiveDateToUtcIso(date, tz || timezone));
        } else {
            onChange(format(date, "yyyy-MM-dd'T'HH:mm:ss") + ".000Z");
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            return;
        }
        if (displayDate) {
            date.setHours(displayDate.getHours(), displayDate.getMinutes());
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
        const base = displayDate ? new Date(displayDate) : new Date();
        base.setHours(parsed.hours, parsed.minutes, 0, 0);
        emitChange(base);
    };

    const handleTimezoneChange = (tz: string) => {
        setTimezone(tz);
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
                            selected={displayDate}
                            onSelect={handleDateSelect}
                            weekStartsOn={weekStartsOn}
                            disabled={[
                                ...(minDate ? [{ before: minDate }] : []),
                                ...(maxDate ? [{ after: maxDate }] : [])
                            ]}
                        />
                        {/*
                         * Stacked, not side by side: TimePicker is itself two Selects (hour and
                         * minute), so putting the timezone beside it puts three controls on one
                         * row and widens the popover past the calendar. The timezone gets its own
                         * full-width row, leaving the calendar to set the popover width.
                         */}
                        <div className="flex flex-col gap-sm px-md pb-md">
                            <TimePicker
                                value={timeValue}
                                onChange={handleTimeChange}
                                disabled={disabled}
                                size="md"
                            />
                            {withTimezone && (
                                <SelectPrimitive
                                    value={timezone}
                                    onChange={handleTimezoneChange}
                                    options={timezoneOptions}
                                    disabled={disabled}
                                    size="md"
                                />
                            )}
                        </div>
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { DateTimePicker };
