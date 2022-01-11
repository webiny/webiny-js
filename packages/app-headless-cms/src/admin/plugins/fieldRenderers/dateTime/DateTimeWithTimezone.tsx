import React, { useState, useEffect } from "react";
import Input from "./Input";
import Select from "./Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    UTC_TIMEZONES,
    DEFAULT_TIME,
    DEFAULT_DATE,
    DEFAULT_TIMEZONE,
    RemoveFieldButton
} from "./utils";
import { CmsEditorField } from "~/types";

interface DateTimeWithTimezoneProps {
    bind: any;
    trailingIcon?: any;
    field: CmsEditorField;
}
interface DateTimeWithTimezoneState {
    date: string;
    time: string;
    timezone: string;
}
const parseDateTime = (value?: string) => {
    if (!value || typeof value !== "string") {
        return {};
    }
    const [formattedDate, rest] = value.split("T");
    if (!formattedDate || !rest) {
        throw new Error(`Could not extract date and time from "${value}".`);
    }
    return {
        formattedDate,
        rest
    };
};

const parseTime = (value?: string) => {
    if (!value) {
        return {};
    }
    const sign = value.includes("+") ? "+" : "-";
    const [fullTime, zone] = value.split(sign);

    return {
        formattedTime: fullTime,
        formattedTimezone: sign + zone
    };
};

const DateTimeWithTimezone: React.FunctionComponent<DateTimeWithTimezoneProps> = ({
    bind,
    trailingIcon,
    field
}) => {
    // "2020-05-18T09:00+10:00"
    const { formattedDate, rest } = parseDateTime(bind.value);
    const { formattedTime, formattedTimezone } = parseTime(rest);
    const [state, setState] = useState<DateTimeWithTimezoneState>({
        date: formattedDate || DEFAULT_DATE,
        time: formattedTime || DEFAULT_TIME,
        timezone: formattedTimezone || DEFAULT_TIMEZONE
    });
    const { date, time, timezone } = state;

    useEffect(() => {
        if (!formattedDate || !formattedTime || !formattedTimezone) {
            return;
        }
        setState(() => ({
            date: formattedDate,
            time: formattedTime,
            timezone: formattedTimezone
        }));
    }, [formattedDate, formattedTime, formattedTimezone]);

    const cellSize = trailingIcon ? 3 : 4;

    return (
        <Grid>
            <Cell span={4}>
                <Input
                    bind={{
                        ...bind,
                        value: date,
                        onChange: (value: string) => {
                            if (!value) {
                                value = new Date().toISOString().substr(0, 10);
                            }
                            setState(prev => ({
                                ...prev,
                                date: value
                            }));
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
                            if (!value) {
                                value = new Date().toISOString().substr(11, 8);
                            }
                            setState(prev => ({
                                ...prev,
                                time: value
                            }));
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
                        setState(prev => ({
                            ...prev,
                            timezone: value
                        }));
                        return bind.onChange(`${date}T${time}${value}`);
                    }}
                    options={UTC_TIMEZONES.map(t => ({ value: t.value, label: t.label }))}
                />
            </Cell>
            <RemoveFieldButton trailingIcon={trailingIcon} />
        </Grid>
    );
};

export default DateTimeWithTimezone;
