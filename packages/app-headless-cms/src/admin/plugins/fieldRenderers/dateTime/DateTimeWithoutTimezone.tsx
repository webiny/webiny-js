import React, { useEffect, useState } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { DEFAULT_DATE, DEFAULT_TIME, RemoveFieldButton } from "./utils";
import Input from "./Input";

interface DateTimeWithoutTimezoneProps {
    bind: any;
    trailingIcon?: any;
    field: any;
}

interface DateTimeWithoutTimezoneState {
    date: string;
    time: string;
}

const parseDateTime = (value?: string) => {
    if (!value) {
        return {};
    }
    if (value.includes("T")) {
        const [formattedDate, formattedTime] = value.split(".")[0].split("T");
        return {
            formattedDate,
            formattedTime
        };
    }
    const [formattedDate, formattedTime] = value.split(" ");
    if (!formattedDate || !formattedTime) {
        throw new Error(`Could not extract date and time from "${value}".`);
    }
    return {
        formattedDate,
        formattedTime
    };
};

const DateTimeWithoutTimezone: React.FunctionComponent<DateTimeWithoutTimezoneProps> = ({
    field,
    bind,
    trailingIcon
}) => {
    // "2020-05-18 09:00:00"
    const { formattedDate, formattedTime } = parseDateTime(bind.value);
    const [state, setState] = useState<DateTimeWithoutTimezoneState>({
        date: formattedDate || DEFAULT_DATE,
        time: formattedTime || DEFAULT_TIME
    });
    const { date, time } = state;
    useEffect(() => {
        if (!formattedDate || !formattedTime) {
            return;
        }
        setState(() => ({
            date: formattedDate,
            time: formattedTime
        }));
    }, [formattedDate, formattedTime]);

    const cellSize = trailingIcon ? 5 : 6;

    return (
        <Grid>
            <Cell span={6}>
                <Input
                    bind={{
                        ...bind,
                        value: date,
                        onChange: value => {
                            if (!value) {
                                value = new Date().toISOString().substr(0, 10);
                            }
                            setState(prev => ({
                                ...prev,
                                date: value
                            }));
                            return bind.onChange(`${value} ${time}`);
                        }
                    }}
                    field={{
                        ...field,
                        label: `${field.label} date`
                    }}
                    type={"date"}
                />
            </Cell>
            <Cell span={cellSize}>
                <Input
                    bind={{
                        ...bind,
                        value: time,
                        onChange: value => {
                            if (!value) {
                                value = new Date().toISOString().substr(11, 8);
                            }
                            setState(prev => ({
                                ...prev,
                                time: value
                            }));
                            return bind.onChange(`${date} ${value}`);
                        }
                    }}
                    field={{
                        ...field,
                        label: `${field.label} time`
                    }}
                    type={"time"}
                    step={5}
                />
            </Cell>
            <RemoveFieldButton trailingIcon={trailingIcon} />
        </Grid>
    );
};

export default DateTimeWithoutTimezone;
