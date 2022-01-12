import React, { useEffect, useState } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { UTC_TIMEZONES, RemoveFieldButton, getFieldValue } from "./utils";
import { CmsEditorField } from "~/types";

interface State {
    date: string;
    time: string;
    timezone: string;
}

const parseDateTime = (value?: string): Pick<State, "date"> & { rest: string } => {
    if (!value || typeof value !== "string") {
        return {
            date: null,
            rest: null
        };
    }
    const [formattedDate, rest] = value.split("T");
    if (!formattedDate || !rest) {
        throw new Error(`Could not extract date and time from "${value}".`);
    }
    return {
        date: formattedDate,
        rest
    };
};

const parseTime = (value?: string): Pick<State, "time" | "timezone"> => {
    if (!value) {
        return {
            time: null,
            timezone: null
        };
    }
    const sign = value.includes("+") ? "+" : "-";
    const [fullTime, zone] = value.split(sign);

    return {
        time: fullTime,
        timezone: sign + zone
    };
};

export interface Props {
    bind: any;
    trailingIcon?: any;
    field: CmsEditorField;
}
export const DateTimeWithTimezone: React.FunctionComponent<Props> = ({
    bind,
    trailingIcon,
    field
}) => {
    // "2020-05-18T09:00+10:00"
    const initialValue = getFieldValue(field, bind, () => {
        const val = new Date().toISOString();
        const date = val.substr(0, 10);
        const time = val.substr(11, 8);
        return `${date}T${time}+00:00`;
    });
    const { date: initialDate, rest } = parseDateTime(initialValue);
    const { time: initialTime, timezone: initialTimezone } = parseTime(rest);

    const [state, setState] = useState<State>({
        date: "",
        time: "",
        timezone: "+00:00"
    });
    const { date, time, timezone } = state;

    useEffect(() => {
        if (!initialDate || !initialTime || !initialTimezone) {
            return;
        }
        setState(() => ({
            date: initialDate,
            time: initialTime,
            timezone: initialTimezone
        }));

        bind.onChange(`${initialDate}T${initialTime}${initialTimezone}`);
    }, []);

    const cellSize = trailingIcon ? 3 : 4;

    return (
        <Grid>
            <Cell span={4}>
                <Input
                    bind={{
                        ...bind,
                        value: date,
                        onChange: (value: string) => {
                            if (!value && initialDate) {
                                value = initialDate;
                            }
                            return bind.onChange(`${value}T${time}${timezone}`);
                        }
                    }}
                    field={{
                        ...field,
                        label: `${field.label} date`
                    }}
                    type={"date"}
                />
            </Cell>
            <Cell span={4}>
                <Input
                    bind={{
                        ...bind,
                        value: time,
                        onChange: value => {
                            if (!value && initialTime) {
                                value = initialTime;
                            }
                            return bind.onChange(`${date}T${value}${timezone}`);
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
            <Cell span={cellSize}>
                <Select
                    label="Timezone"
                    value={timezone}
                    onChange={value => {
                        if (!value) {
                            value = initialTimezone || "+00:00";
                        }
                        return bind.onChange(`${date}T${time}${value}`);
                    }}
                    options={UTC_TIMEZONES.map(t => ({ value: t.value, label: t.label }))}
                />
            </Cell>
            <RemoveFieldButton trailingIcon={trailingIcon} />
        </Grid>
    );
};
