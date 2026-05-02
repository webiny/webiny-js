import React from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/schedule.svg";
import { Icon } from "~/Icon/index.js";
import { InputPrimitive, type InputPrimitiveProps } from "~/Input/index.js";

interface TimePickerProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    disabled?: boolean;
    size?: InputPrimitiveProps["size"];
    variant?: InputPrimitiveProps["variant"];
    invalid?: InputPrimitiveProps["invalid"];
    className?: string;
}

const TimePicker = ({
    value,
    onChange,
    disabled,
    size,
    variant,
    invalid,
    className
}: TimePickerProps) => {
    return (
        <InputPrimitive
            type="time"
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
            size={size}
            variant={variant}
            invalid={invalid}
            className={className}
            startIcon={<Icon icon={<ScheduleIcon />} label="Time" size="sm" color="inherit" />}
        />
    );
};

export { TimePicker, type TimePickerProps };
