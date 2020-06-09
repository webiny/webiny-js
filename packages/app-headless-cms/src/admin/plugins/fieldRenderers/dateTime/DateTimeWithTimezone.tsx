import React from "react";
import Input from "./Input";
import Select from "./Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    UTC_TIMEZONES,
    DEFAULT_TIME,
    DEFAULT_DATE,
    DEFAULT_TIMEZONE,
    appendTextToLabel,
    RemoveFieldButton
} from "./utils";

const DateTimeWithTimezone = props => {
    // "2020-05-18T09:00+10:00"
    const [date, setDate] = React.useState("");
    const [time, setTime] = React.useState("");
    const [timezone, setTimezone] = React.useState("");

    React.useEffect(() => {
        if (props.bind.value === null) {
            // Set initial values
            setDate(DEFAULT_DATE);
            setTime(DEFAULT_TIME);
            setTimezone(DEFAULT_TIMEZONE);
            return;
        }
        const [isoDate, rest] = props.bind.value.split("T");
        const sign = rest.includes("+") ? "+" : "-";
        const [fullTime, zone] = rest.split(sign);

        const formattedDate = isoDate;
        const formattedTime = fullTime;
        const formattedTimezone = sign + zone;

        // Set previously saved values
        if (date !== formattedDate) {
            setDate(formattedDate);
        }
        if (time !== formattedTime) {
            setTime(formattedTime);
        }
        if (timezone !== formattedTimezone) {
            setTimezone(formattedTimezone);
        }
    }, [props.bind.value]);

    const cellSize = props.trailingIcon ? 3 : 4;

    return (
        <Grid>
            <Cell span={4}>
                <Input
                    bind={{
                        ...props.bind,
                        value: date,
                        onChange: value => {
                            setDate(value);
                            return props.bind.onChange(`${value}T${time}${timezone}`);
                        }
                    }}
                    field={{
                        ...props.field,
                        label: appendTextToLabel(props.field.label, " date")
                    }}
                    type={"date"}
                />
            </Cell>
            <Cell span={4}>
                <Input
                    bind={{
                        ...props.bind,
                        value: time,
                        onChange: value => {
                            setTime(value);
                            return props.bind.onChange(`${date}T${value}${timezone}`);
                        }
                    }}
                    field={{
                        ...props.field,
                        label: appendTextToLabel(props.field.label, " time")
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
                        setTimezone(value);
                        return props.bind.onChange(`${date}T${time}${value}`);
                    }}
                    options={UTC_TIMEZONES.map(t => ({ value: t.value, label: t.label }))}
                />
            </Cell>
            <RemoveFieldButton trailingIcon={props.trailingIcon}/>
        </Grid>
    );
};

export default DateTimeWithTimezone;
