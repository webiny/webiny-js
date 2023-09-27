import React, { useState } from "react";

import { useBind } from "@webiny/form";
import { Input } from "@webiny/ui/Input";

interface DateWithoutTimezoneProps {
    name: string;
}

export const DateWithoutTimezone = ({ name }: DateWithoutTimezoneProps) => {
    const [dateTime, setDateTime] = useState("");

    const { onChange } = useBind({
        name
    });

    const handleOnChange = (value: string) => {
        const dateWithTimeZone = value + "Z";
        const date = new Date(dateWithTimeZone);
        const dateTimeToISOString = date.toISOString();

        setDateTime(dateTimeToISOString.slice(0, -5));
        onChange(dateTimeToISOString);
    };

    return (
        <Input label={"Value"} type={"datetime-local"} onChange={handleOnChange} value={dateTime} />
    );
};
