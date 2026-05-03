import React, { useMemo, useState } from "react";
import { eachDayOfInterval, endOfISOWeek, startOfISOWeek } from "date-fns";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { WeekPickerProps } from "../utils/types.js";
import { formatDateForDisplay, formatWeekValue, parseWeekValue } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";

function weekDatesFromParsed(parsed: { year: number; week: number }): Date[] {
    const jan4 = new Date(parsed.year, 0, 4);
    const weekStart = startOfISOWeek(new Date(jan4.getTime() + (parsed.week - 1) * 7 * 86400000));
    return eachDayOfInterval({ start: weekStart, end: endOfISOWeek(weekStart) });
}

const WeekPicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    onOpenChange,
    className,
    displayFormat
}: WeekPickerProps) => {
    const [open, setOpen] = useState(false);
    const [hoveredDay, setHoveredDay] = useState<Date | undefined>();

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setHoveredDay(undefined);
        }
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    };

    const displayValue = formatDateForDisplay(value, "week", displayFormat);

    const parsed = value ? parseWeekValue(value) : undefined;
    const selectedWeekDays = useMemo(() => (parsed ? weekDatesFromParsed(parsed) : []), [value]);

    const hoveredWeekDays = useMemo(() => {
        if (!hoveredDay) {
            return [];
        }
        const start = startOfISOWeek(hoveredDay);
        return eachDayOfInterval({ start, end: endOfISOWeek(start) });
    }, [hoveredDay]);

    const modifiers = useMemo(
        () => ({
            selectedWeek: selectedWeekDays,
            selectedWeekStart: selectedWeekDays.length > 0 ? [selectedWeekDays[0]] : [],
            selectedWeekEnd: selectedWeekDays.length > 0 ? [selectedWeekDays[6]] : [],
            hoveredWeek: hoveredWeekDays,
            hoveredWeekStart: hoveredWeekDays.length > 0 ? [hoveredWeekDays[0]] : [],
            hoveredWeekEnd: hoveredWeekDays.length > 0 ? [hoveredWeekDays[6]] : []
        }),
        [selectedWeekDays, hoveredWeekDays]
    );

    const modifiersClassNames = useMemo(
        () => ({
            selectedWeek:
                "bg-primary-subtle [&>button]:bg-transparent [&>button]:text-primary-strong [&>button]:rounded-none [&>button]:hover:bg-primary-subtle/70",
            selectedWeekStart:
                "[&>button]:bg-primary [&>button]:text-neutral-base [&>button]:rounded-l-sm [&>button]:rounded-r-none [&>button]:hover:bg-primary-strong",
            selectedWeekEnd:
                "[&>button]:bg-primary [&>button]:text-neutral-base [&>button]:rounded-r-sm [&>button]:rounded-l-none [&>button]:hover:bg-primary-strong",
            hoveredWeek: "bg-neutral-light [&>button]:rounded-none",
            hoveredWeekStart: "[&>button]:rounded-l-sm [&>button]:rounded-r-none",
            hoveredWeekEnd: "[&>button]:rounded-r-sm [&>button]:rounded-l-none"
        }),
        []
    );

    return (
        <div className={className}>
            <PopoverPrimitive open={open} onOpenChange={handleOpenChange}>
                <DatePickerTrigger
                    displayValue={displayValue}
                    placeholder={placeholder ?? "Pick a week"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
                <PopoverPrimitive.Content align="start">
                    <Calendar
                        modifiers={modifiers}
                        modifiersClassNames={modifiersClassNames}
                        onDayClick={date => {
                            if (onChange) {
                                onChange(formatWeekValue(date));
                            }
                            handleOpenChange(false);
                        }}
                        onDayMouseEnter={day => setHoveredDay(day)}
                        onDayMouseLeave={() => setHoveredDay(undefined)}
                        ISOWeek
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

export { WeekPicker };
