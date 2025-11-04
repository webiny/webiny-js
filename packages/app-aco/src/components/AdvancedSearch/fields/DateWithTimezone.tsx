import React, { useEffect, useState } from "react";
import { useBind } from "@webiny/form";
import { UTC_TIMEZONES } from "@webiny/utils";
import { useInputField } from "~/components/index.js";
import { Input, Select } from "@webiny/admin-ui";

export const DateWithTimezone = () => {
    const { name } = useInputField();

    const [dateTime, setDateTime] = useState("");
    const [timeZone, setTimeZone] = useState("+00:00");

    const { onChange, value } = useBind({
        name
    });

    useEffect(() => {
        if (value) {
            setDateTime(value.slice(0, -6));
            setTimeZone(value.slice(-6) || "+00:00");
        }
    }, [value]);

    const handleDateTimeChange = (value: string) => {
        const date = new Date(value);
        const dateTimeNormalized = date.toISOString().slice(0, -5);
        onChange(`${dateTimeNormalized}${timeZone}`);
    };

    const handleTimeZoneChange = (value: string) => {
        onChange(`${dateTime}${value}`);
    };

    return (
        <div className={"flex justify-between"}>
            <div className={"w-1/2"}>
                <Input
                    label={"Value"}
                    type={"datetime-local"}
                    value={dateTime}
                    onChange={handleDateTimeChange}
                    size={"lg"}
                />
            </div>
            <div className={"w-2/5"}>
                <Select
                    label={"Time Zone"}
                    value={timeZone}
                    options={(UTC_TIMEZONES || []).map(({ value, label }) => ({
                        label,
                        value
                    }))}
                    onChange={handleTimeZoneChange}
                    size={"lg"}
                />
            </div>
        </div>
    );
};
