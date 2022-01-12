import React, { useEffect, useState } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { getFieldValue, RemoveFieldButton } from "./utils";
import { Input } from "./Input";
import { CmsEditorField } from "~/types";

interface State {
    date: string;
    time: string;
}

const parseDateTime = (value?: string): State => {
    if (!value) {
        return {
            date: null,
            time: null
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
        throw new Error(`Could not extract date and time from "${value}".`);
    }
    return {
        date,
        time
    };
};

export interface Props {
    bind: any;
    trailingIcon?: any;
    field: CmsEditorField;
}
export const DateTimeWithoutTimezone: React.FunctionComponent<Props> = ({
    field,
    bind,
    trailingIcon
}) => {
    // "2020-05-18 09:00:00"
    const initialValue = getFieldValue(field, bind, () => {
        const val = new Date().toISOString();
        const date = val.substr(0, 10);
        const time = val.substr(11, 8);
        return `${date} ${time}`;
    });
    const { date: initialDate, time: initialTime } = parseDateTime(initialValue);
    const [state, setState] = useState<State>({
        date: "",
        time: ""
    });
    const { date, time } = state;

    useEffect(() => {
        if (!initialDate || !initialTime) {
            return;
        }
        setState(prev => {
            return {
                ...prev,
                date: initialDate,
                time: initialTime
            };
        });
        bind.onChange(`${initialDate} ${initialTime}`);
    }, []);

    const cellSize = trailingIcon ? 5 : 6;

    return (
        <Grid>
            <Cell span={6}>
                <Input
                    bind={{
                        ...bind,
                        value: date,
                        onChange: value => {
                            if (!value && initialDate) {
                                value = initialDate;
                            }
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
                            if (!value && initialTime) {
                                value = initialTime;
                            }
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
