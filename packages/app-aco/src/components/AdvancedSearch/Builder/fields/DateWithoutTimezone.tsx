import React from "react";

import { useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";

interface DateWithoutTimezoneProps {
    name: string;
}

export const DateWithoutTimezone: React.VFC<DateWithoutTimezoneProps> = ({ name }) => {
    const { onChange, validate } = useBind({
        name,
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

    const handleOnChange = (value: string) => {
        const date = new Date(value);
        onChange(date.toISOString());
    };

    return (
        <Input
            label={"Value"}
            type={"datetime-local"}
            onChange={handleOnChange}
            onBlur={onBlur}
            required={true}
        />
    );
};
