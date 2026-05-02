import React from "react";
import type { TimeOnlyPickerProps } from "../utils/types.js";
import { TimePicker } from "./components/TimePicker.js";

const TimeOnlyPicker = ({
    value,
    onChange,
    disabled,
    size,
    variant,
    invalid,
    className
}: TimeOnlyPickerProps) => {
    return (
        <TimePicker
            value={value}
            onChange={onChange}
            disabled={disabled}
            size={size}
            variant={variant}
            invalid={invalid}
            className={className}
        />
    );
};

export { TimeOnlyPicker };
