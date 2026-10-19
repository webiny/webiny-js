import React, { useMemo } from "react";
import { makeDecoratable } from "~/utils.js";
import type { DatePickerPrimitiveProps } from "./primitives/index.js";
import { DatePickerPrimitive } from "./primitives/index.js";
import type { FormComponentProps } from "~/FormComponent/index.js";
import {
    FormComponentDescription,
    FormComponentErrorMessage,
    FormComponentLabel,
    FormComponentNote
} from "~/FormComponent/index.js";
import { Text } from "~/Text/index.js";

interface DatePickerOwnProps {
    showTimezone?: boolean;
}

type DatePickerProps = DatePickerPrimitiveProps & FormComponentProps & DatePickerOwnProps;

const TimezoneLabel = () => {
    const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
    return (
        <Text size={"sm"} className={"text-neutral-strong mt-xxs"}>
            Timezone: {timezone}
        </Text>
    );
};

const DecoratableDatePicker = ({
    label,
    description,
    note,
    hint,
    required,
    disabled,
    validation,
    showTimezone = false,
    ...props
}: DatePickerProps) => {
    const { isValid: validationIsValid, message: validationMessage } = validation || {};
    const invalid = useMemo(() => validationIsValid === false, [validationIsValid]);

    return (
        <div className="w-full">
            <FormComponentLabel
                text={label}
                hint={hint}
                required={required}
                disabled={disabled}
                invalid={invalid}
            />
            <FormComponentDescription text={description} disabled={disabled} />
            <DatePickerPrimitive
                {...(props as DatePickerPrimitiveProps)}
                disabled={disabled}
                invalid={invalid}
            />
            {showTimezone && <TimezoneLabel />}
            <FormComponentErrorMessage
                text={validationMessage}
                invalid={invalid}
                disabled={disabled}
            />
            <FormComponentNote text={note} disabled={disabled} />
        </div>
    );
};

const DatePicker = makeDecoratable("DatePicker", DecoratableDatePicker);

export { DatePicker, type DatePickerProps };
