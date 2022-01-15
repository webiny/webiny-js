import React, { useEffect } from "react";
import { Input, Props } from "./Input";
import {
    getCurrentLocalTime,
    getDefaultFieldValue
} from "~/admin/plugins/fieldRenderers/dateTime/utils";

export const Time: React.FC<Props> = props => {
    const { field, bind } = props;
    const time = getDefaultFieldValue(field, bind, () => {
        return getCurrentLocalTime(new Date());
    });

    const bindValue = bind.value || "";

    useEffect(() => {
        if (!time || bindValue === time) {
            return;
        }
        bind.onChange(time);
    }, [bindValue]);

    return (
        <Input
            {...props}
            bind={{
                ...bind,
                value: time,
                onChange: (value: string) => {
                    if (!value) {
                        if (bind.value) {
                            return;
                        }
                        return bind.onChange("");
                    }
                    return bind.onChange(value);
                }
            }}
            type={"time"}
            step={5}
        />
    );
};
