import React from "react";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import { BindComponent } from "@webiny/form/types";

const UTC_TIMEZONES = [
    {
        value: "-12:00",
        label: "UTC-12:00"
    },
    {
        value: "-11:00",
        label: "UTC-11:00"
    },
    {
        value: "-10:00",
        label: "UTC-10:00"
    },
    {
        value: "-09:30",
        label: "UTC-09:30"
    },
    {
        value: "-09:00",
        label: "UTC-09:00"
    },
    {
        value: "-08:00",
        label: "UTC-08:00"
    },
    {
        value: "-07:00",
        label: "UTC-07:00"
    },
    {
        value: "-06:00",
        label: "UTC-06:00"
    },
    {
        value: "-05:00",
        label: "UTC-05:00"
    },
    {
        value: "-04:30",
        label: "UTC-04:30"
    },
    {
        value: "-04:00",
        label: "UTC-04:00"
    },
    {
        value: "-03:30",
        label: "UTC-03:30"
    },
    {
        value: "-03:00",
        label: "UTC-03:00"
    },
    {
        value: "-02:00",
        label: "UTC-02:00"
    },
    {
        value: "-01:00",
        label: "UTC-01:00"
    },
    {
        value: "+00:00",
        label: "UTC+00:00"
    },
    {
        value: "+01:00",
        label: "UTC+01:00"
    },
    {
        value: "+02:00",
        label: "UTC+02:00"
    },
    {
        value: "+03:00",
        label: "UTC+03:00"
    },
    {
        value: "+03:30",
        label: "UTC+03:30"
    },
    {
        value: "+04:00",
        label: "UTC+04:00"
    },
    {
        value: "+04:30",
        label: "UTC+04:30"
    },
    {
        value: "+05:30",
        label: "UTC+05:30"
    },
    {
        value: "+05:45",
        label: "UTC+05:45"
    },
    {
        value: "+06:00",
        label: "UTC+06:00"
    },
    {
        value: "+06:30",
        label: "UTC+06:30"
    },
    {
        value: "+07:00",
        label: "UTC+07:00"
    },
    {
        value: "+08:00",
        label: "UTC+08:00"
    },
    {
        value: "+08:45",
        label: "UTC+08:45"
    },
    {
        value: "+09:00",
        label: "UTC+09:00"
    },
    {
        value: "+09:30",
        label: "UTC+09:30"
    },
    {
        value: "+10:00",
        label: "UTC+10:00"
    },
    {
        value: "+10:30",
        label: "UTC+10:30"
    },
    {
        value: "+11:00",
        label: "UTC+11:00"
    },
    {
        value: "+11:30",
        label: "UTC+11:30"
    },
    {
        value: "+12:00",
        label: "UTC+12:00"
    },
    {
        value: "+12:45",
        label: "UTC+12:45"
    },
    {
        value: "+13:00",
        label: "UTC+13:00"
    },
    {
        value: "+14:00",
        label: "UTC+14:00"
    }
];

export const Date = ({ fieldFormat, Bind } : { fieldFormat: string, Bind: BindComponent }) => {
    if (fieldFormat === "time") {
        return (
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.value"} validators={validation.create("required")}>
                        <Input label={"Time"} type="time" />
                    </Bind>
                </Cell>
            </Grid>
        );
    }

    if (fieldFormat === "dateTimeWithTimezone") {
        return (
            <Grid>
                <Cell span={8}>
                    <Bind name={"settings.value"} validators={validation.create("required")}>
                        <Input label={"Date/Time"} type="datetime-local" />
                    </Bind>
                </Cell>
                <Cell span={4}>
                    <Bind name={"settings.timeZone"} validators={validation.create("required")}>
                        <Select label={"Timezone"}>
                            {UTC_TIMEZONES.map(({ value, label }) => (
                                <option value={value} key={label}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
        );
    }

    if (fieldFormat === "dateTimeWithoutTimezone") {
        return (
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.value"} validators={validation.create("required")}>
                        <Input label={"Date/Time"} type="datetime-local" />
                    </Bind>
                </Cell>
            </Grid>
        );
    }

    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"settings.value"} validators={validation.create("required")}>
                    <Input label={"Date"} type="date" />
                </Bind>
            </Cell>
        </Grid>
    )
}
