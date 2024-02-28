import React, { useEffect, useState } from "react";

import { useBind } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { useInputField } from "~/components";

export const DateWithoutTimezone = () => {
    const { name } = useInputField();

    const [dateTime, setDateTime] = useState("");

    const { onChange, value } = useBind({
        name
    });

    useEffect(() => {
        setDateTime(value.slice(0, -5));
    }, [value]);

    const handleOnChange = (value: string) => {
        const dateWithTimeZone = value + "Z";
        const date = new Date(dateWithTimeZone);
        const dateTimeToISOString = date.toISOString();

        onChange(dateTimeToISOString);
    };

    return (
        <Input label={"Value"} type={"datetime-local"} onChange={handleOnChange} value={dateTime} />
    );
};
