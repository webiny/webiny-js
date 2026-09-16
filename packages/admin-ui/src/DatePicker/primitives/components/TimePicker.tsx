import React from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/schedule.svg";
import { Icon } from "~/Icon/index.js";
import type { InputPrimitiveProps } from "~/Input/index.js";
import { SelectPrimitive } from "~/Select/index.js";
import { cn } from "~/utils.js";

interface TimePickerProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    disabled?: boolean;
    size?: InputPrimitiveProps["size"];
    variant?: InputPrimitiveProps["variant"];
    invalid?: InputPrimitiveProps["invalid"];
    className?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

const buildOptions = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ value: pad(index), label: pad(index) }));

const HOUR_OPTIONS = buildOptions(24);
const MINUTE_OPTIONS = buildOptions(60);

/**
 * Hour and minute are two `Select`s rather than a native `<input type="time">`.
 *
 * The native input hands the browser control of both the picker indicator and the dropdown
 * list: neither can be styled, so they render as a Chrome widget next to the fully custom
 * `Calendar` this sits under, and the list positions itself on "now" whenever the typed value
 * is incomplete — showing times unrelated to the field. Two Selects keep the control inside
 * the design system, so it themes with everything else and always shows the real value.
 */
const TimePicker = ({
    value,
    onChange,
    disabled,
    size,
    variant,
    invalid,
    className
}: TimePickerProps) => {
    const [hours = "", minutes = ""] = (value ?? "").split(":");

    const emit = (nextHours: string, nextMinutes: string) => {
        if (!onChange) {
            return;
        }

        if (!nextHours && !nextMinutes) {
            onChange(undefined);
            return;
        }

        // Picking one half alone still yields a usable time; the other defaults to "00".
        onChange(`${nextHours || "00"}:${nextMinutes || "00"}`);
    };

    return (
        <div className={cn("flex items-center gap-sm", className)}>
            <div className={"flex-1 min-w-0"}>
                <SelectPrimitive
                    value={hours}
                    onChange={nextHours => emit(nextHours, minutes)}
                    options={HOUR_OPTIONS}
                    placeholder={"Hour"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                    startIcon={
                        <Icon
                            icon={<ScheduleIcon />}
                            label={"Time"}
                            size={"sm"}
                            color={"inherit"}
                        />
                    }
                />
            </div>
            <div className={"flex-1 min-w-0"}>
                <SelectPrimitive
                    value={minutes}
                    onChange={nextMinutes => emit(hours, nextMinutes)}
                    options={MINUTE_OPTIONS}
                    placeholder={"Minute"}
                    disabled={disabled}
                    size={size}
                    variant={variant}
                    invalid={invalid}
                />
            </div>
        </div>
    );
};

export { TimePicker, type TimePickerProps };
