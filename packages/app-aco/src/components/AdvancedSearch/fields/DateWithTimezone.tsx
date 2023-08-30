import React, { useState } from "react";

import { useBind } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { UTC_TIMEZONES } from "@webiny/utils";
import { validation } from "@webiny/validation";

export const DateWithTimezone = () => {
    const [dateTime, setDateTime] = useState("");
    const [timeZone, setTimeZone] = useState("+00:00");

    const { onChange, validate } = useBind({
        name: "value",
        validators: [validation.create("required")]
    });

    const onBlur = (ev: React.SyntheticEvent) => {
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            ev.persist();
            validate();
        }
    };

    const handleDateTimeChange = (value: string) => {
        const date = new Date(value);
        const dateTimeNormalized = date.toISOString().slice(0, -5);
        setDateTime(dateTimeNormalized);
        onChange(`${dateTimeNormalized}${timeZone}`);
    };

    const handleTimeZoneChange = (value: string) => {
        setTimeZone(value);
        onChange(`${dateTime}${value}`);
    };

    return (
        <>
            <Input
                label={"Value"}
                type={"datetime-local"}
                value={dateTime}
                onChange={handleDateTimeChange}
                onBlur={onBlur}
                required={true}
            />

            <Select
                label={"Time Zone"}
                value={timeZone}
                options={(UTC_TIMEZONES || []).map(({ value, label }) => ({
                    label,
                    value
                }))}
                onChange={handleTimeZoneChange}
                required={true}
            />
        </>
    );
};
