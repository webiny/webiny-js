import React, { useState } from "react";
import styled from "@emotion/styled";

import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { UTC_TIMEZONES } from "@webiny/utils";
import { FbFormCondition } from "~/types";

interface Props {
    value: string;
    settings: Record<string, any>;
    handleOnChange: (
        conditionProperty: keyof FbFormCondition,
        conditionPropertyValue: string
    ) => void;
}

const DateTimeWrapper = styled("div")`
    display: flex;
    & .webiny-ui-input {
        margin-right: 15px;
    }
`;

const DateTimeWithTimeZone = ({
    handleOnChange,
    value
}: Pick<Props, "handleOnChange" | "value">) => {
    const valueTimeZone = value.match(/\+(?:\S){1,}/gm);
    const valueDateTime = value.replace(/\+(?:\S){1,}/gm, "");
    const [dateTime, setDateTime] = useState(valueDateTime || "");
    const [timeZone, setTimeZone] = useState(valueTimeZone?.[0] || "+03:00");

    return (
        <>
            <Input
                type="datetime-local"
                value={dateTime}
                onChange={value => {
                    setDateTime(value);
                    handleOnChange("filterValue", `${value}${timeZone}`);
                }}
            />
            <Select
                value={timeZone}
                label="Select Time Zone"
                onChange={value => {
                    setTimeZone(value);
                    handleOnChange("filterValue", `${dateTime}${value}`);
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

export const DateTime: React.FC<Props> = ({ settings, handleOnChange, value }) => {
    if (settings.format === "time") {
        return (
            <DateTimeWrapper>
                <Input
                    type="time"
                    value={value}
                    onChange={value => handleOnChange("filterValue", value)}
                />
            </DateTimeWrapper>
        );
    } else if (settings.format === "dateTimeWithoutTimezone") {
        return (
            <DateTimeWrapper>
                <Input
                    type="datetime-local"
                    value={value}
                    onChange={value => handleOnChange("filterValue", value)}
                />
            </DateTimeWrapper>
        );
    } else if (settings.format === "dateTimeWithTimezone") {
        return (
            <DateTimeWrapper>
                <DateTimeWithTimeZone handleOnChange={handleOnChange} value={value} />
            </DateTimeWrapper>
        );
    } else {
        return (
            <DateTimeWrapper>
                <Input
                    type="date"
                    value={value}
                    onChange={value => handleOnChange("filterValue", value)}
                />
            </DateTimeWrapper>
        );
    }
};
