import React from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    RemoveFieldButton,
    getDefaultFieldValue,
    DEFAULT_TIMEZONE,
    getCurrentDate,
    getCurrentLocalTime,
    getCurrentTimeZone,
    getHHmmss,
    getHHmm
} from "./utils";
import { CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { UTC_TIMEZONES } from "@webiny/utils";

interface State {
    date: string;
    time: string;
    timezone: string;
}

const parseDateTime = (value?: string): Pick<State, "date"> & { rest: string } => {
    if (!value || typeof value !== "string") {
        return {
            date: "",
            rest: ""
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

const parseTime = (value?: string, defaultTimeZone?: string): Pick<State, "time" | "timezone"> => {
    if (!value) {
        return {
            time: "",
            timezone: defaultTimeZone || ""
        };
    }
    const sign = value.includes("+") ? "+" : "-";
    const [fullTime, zone] = value.split(sign);

    return {
        time: fullTime,
        timezone: sign + zone
    };
};

export interface DateTimeWithTimezoneProps {
    bind: BindComponentRenderProp;
    trailingIcon?: any;
    field: CmsModelField;
}
export const DateTimeWithTimezone = ({ bind, trailingIcon, field }: DateTimeWithTimezoneProps) => {
    const defaultTimeZone = getCurrentTimeZone() || DEFAULT_TIMEZONE;

    // "2020-05-18T09:00+10:00"
    const value =
        bind.value ||
        getDefaultFieldValue(field, bind, () => {
            const date = new Date();
            return `${getCurrentDate(date)}T${getCurrentLocalTime(date)}${defaultTimeZone}`;
        });

    const { date, rest } = parseDateTime(value);
    const { time, timezone } = parseTime(rest, defaultTimeZone);

    const cellSize = trailingIcon ? 3 : 4;

    return (
        <Grid>
            <Cell span={4}>
                <Input
                    bind={{
                        ...bind,
                        value: date,
                        onChange: async (value: string) => {
                            if (!value) {
                                if (!bind.value) {
                                    return;
                                }
                                return bind.onChange("");
                            }

                            return bind.onChange(`${value}T${getHHmmss(time)}${timezone}`);
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
                        value: getHHmm(time),
                        onChange: async value => {
                            if (!value) {
                                if (!bind.value) {
                                    return;
                                }
                                return bind.onChange("");
                            }
                            return bind.onChange(
                                `${date || getCurrentDate()}T${getHHmmss(value)}${timezone}`
                            );
                        }
                    }}
                    field={{
                        ...field,
                        label: `${field.label} time`
                    }}
                    type={"time"}
                    step={60}
                />
            </Cell>
            <Cell span={cellSize}>
                <Select
                    label="Timezone"
                    value={timezone}
                    onChange={value => {
                        if (!value) {
                            if (!bind.value) {
                                return null;
                            }
                            return bind.onChange("");
                        }
                        return bind.onChange(
                            `${date || getCurrentDate()}T${time || getCurrentLocalTime()}${value}`
                        );
                    }}
                    options={UTC_TIMEZONES.map(t => ({ value: t.value, label: t.label }))}
                />
            </Cell>
            <RemoveFieldButton trailingIcon={trailingIcon} />
        </Grid>
    );
};
