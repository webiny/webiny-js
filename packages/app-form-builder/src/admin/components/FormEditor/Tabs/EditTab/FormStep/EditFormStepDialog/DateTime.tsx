import React, { useState } from "react";
import styled from "@emotion/styled";

import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { UTC_TIMEZONES } from "@webiny/utils";

interface Props {
    settings: Record<string, any>;
    handleCondition: (property: string, val: string) => void;
    value: string;
}

const DateTimeWrapper = styled("div")`
    display: flex;

    & .webiny-ui-input {
        margin-right: 15px;
    }
`;

const DateTimeWithTimeZone = ({
    handleCondition,
    value
}: Pick<Props, "handleCondition" | "value">) => {
    const valueTimeZone = value.match(/\+(?:\S){1,}/gm);
    const valueDateTime = value.replace(/\+(?:\S){1,}/gm, "");
    const [dateTime, setDateTime] = useState(valueDateTime || "");
    const [timeZone, setTimeZone] = useState(valueTimeZone?.[0] || "+03:00");

    return (
        <>
            <Input
                type="datetime-local"
                value={dateTime}
                onChange={val => {
                    setDateTime(val);
                    handleCondition("filterValue", `${val}${timeZone}`);
                }}
            />
            <Select
                value={timeZone}
                label="Select Time Zone"
                onChange={val => {
                    setTimeZone(val);
                    handleCondition("filterValue", `${dateTime}${val}`);
                }}
            >
                {UTC_TIMEZONES.map(utc => (
                    <option key={utc.value} value={utc.value}>
                        {utc.label}
                    </option>
                ))}
            </Select>
        </>
    );
};

export const DateTime: React.FC<Props> = ({ settings, handleCondition, value }) => {
    if (settings.format === "time") {
        return (
            <DateTimeWrapper>
                <Input
                    type="time"
                    value={value}
                    onChange={val => handleCondition("filterValue", val)}
                />
            </DateTimeWrapper>
        );
    } else if (settings.format === "dateTimeWithoutTimezone") {
        return (
            <DateTimeWrapper>
                <Input
                    type="datetime-local"
                    value={value}
                    onChange={val => handleCondition("filterValue", val)}
                />
            </DateTimeWrapper>
        );
    } else if (settings.format === "dateTimeWithTimezone") {
        return (
            <DateTimeWrapper>
                <DateTimeWithTimeZone handleCondition={handleCondition} value={value} />
            </DateTimeWrapper>
        );
    } else {
        return (
            <DateTimeWrapper>
                <Input
                    type="date"
                    value={value}
                    onChange={val => handleCondition("filterValue", val)}
                />
            </DateTimeWrapper>
        );
    }
};
