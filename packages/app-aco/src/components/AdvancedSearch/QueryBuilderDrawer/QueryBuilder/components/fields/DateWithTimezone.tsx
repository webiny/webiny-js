import React, { useEffect, useState } from "react";

import styled from "@emotion/styled";
import { useBind } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { UTC_TIMEZONES } from "@webiny/utils";

const DateWithTimezoneContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

const DateTimeInputContainer = styled.div`
    width: 50%;
`;

const TimeZoneSelectContainer = styled.div`
    width: 45%;
`;

interface DateWithTimezoneProps {
    name: string;
}

export const DateWithTimezone = ({ name }: DateWithTimezoneProps) => {
    const [dateTime, setDateTime] = useState("");
    const [timeZone, setTimeZone] = useState("+00:00");

    const { onChange, value } = useBind({
        name
    });

    useEffect(() => {
        setDateTime(value.slice(0, -6));
        setTimeZone(value.slice(-6) || "+00:00");
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
        <DateWithTimezoneContainer>
            <DateTimeInputContainer>
                <Input
                    label={"Value"}
                    type={"datetime-local"}
                    value={dateTime}
                    onChange={handleDateTimeChange}
                />
            </DateTimeInputContainer>
            <TimeZoneSelectContainer>
                <Select
                    label={"Time Zone"}
                    value={timeZone}
                    options={(UTC_TIMEZONES || []).map(({ value, label }) => ({
                        label,
                        value
                    }))}
                    onChange={handleTimeZoneChange}
                />
            </TimeZoneSelectContainer>
        </DateWithTimezoneContainer>
    );
};
