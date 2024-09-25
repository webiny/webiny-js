import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    getCurrentDate,
    getCurrentLocalTime,
    getDefaultFieldValue,
    getHHmm,
    getHHmmss,
    RemoveFieldButton
} from "./utils";
import { Input } from "./Input";
import { CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";

interface State {
    date: string;
    time: string;
}

const parseDateTime = (value?: string): State => {
    if (!value) {
        return {
            date: "",
            time: ""
        };
    }
    if (value.includes("T")) {
        const [date, time] = value.split(".")[0].split("T");
        return {
            date,
            time
        };
    }
    const [date, time] = value.split(" ");
    if (!date || !time) {
        console.error(`Could not extract date and time from "${value}".`);

        return {
            date: "",
            time: ""
        };
    }
    return {
        date,
        time
    };
};

export interface DateTimeWithoutTimezoneProps {
    bind: BindComponentRenderProp;
    trailingIcon?: any;
    field: CmsModelField;
}
export const DateTimeWithoutTimezone = ({
    field,
    bind,
    trailingIcon
}: DateTimeWithoutTimezoneProps) => {
    // "2020-05-18 09:00:00"
    const value =
        bind.value ||
        getDefaultFieldValue(field, bind, () => {
            const date = new Date();
            return `${getCurrentDate(date)} ${getCurrentLocalTime(date)}`;
        });

    const { date, time } = parseDateTime(value);

    const cellSize = trailingIcon ? 5 : 6;

    return (
        <Grid>
            <Cell span={6}>
                <Input
                    bind={{
                        ...bind,
                        value: date,
                        onChange: async value => {
                            if (!value) {
                                if (!bind.value) {
                                    return;
                                }
                                return bind.onChange("");
                            }
                            return bind.onChange(`${value} ${getHHmmss(time)}`);
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
                        value: getHHmm(time),
                        onChange: async value => {
                            if (!value) {
                                if (!bind.value) {
                                    return;
                                }
                                return bind.onChange("");
                            }
                            return bind.onChange(`${date || getCurrentDate()} ${getHHmmss(value)}`);
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
            <RemoveFieldButton trailingIcon={trailingIcon} />
        </Grid>
    );
};
