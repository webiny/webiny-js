import React, { useState, useEffect } from "react";
import { Input, Props } from "./Input";
import { getFieldValue } from "~/admin/plugins/fieldRenderers/dateTime/utils";

export const Time: React.FC<Props> = props => {
    const initialTime = getFieldValue(props.field, props.bind, () => {
        return new Date().toISOString().substr(11, 8);
    });

    const [time, setTime] = useState<string>("");

    useEffect(() => {
        if (!initialTime) {
            return;
        }
        setTime(initialTime);
        props.bind.onChange(initialTime);
    }, []);

    // "09:00:00"
    return (
        <Input
            {...props}
            bind={{
                ...props.bind,
                value: time,
                onChange: (value: string) => {
                    if (!value) {
                    }
                    return props.bind.onChange(value);
                }
            }}
            type={"time"}
            step={5}
        />
    );
};
