import React from "react";
import {
    FormComponentDescription,
    FormComponentLabel,
    FormComponentNote,
    Grid,
    Input,
    Select
} from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { UTC_TIMEZONES } from "@webiny/utils";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dateTimeInput: {
            fieldType: "datetime";
            settings: {
                type: "date" | "dateTimeWithoutTimezone" | "dateTimeWithTimezone" | "time";
            };
        };
    }
}

const DEFAULT_TIMEZONE = "+01:00";

const getCurrentDate = (date = new Date()) => {
    const y = String(date.getFullYear()).padStart(4, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const getCurrentLocalTime = (date = new Date()) => {
    const value = date.toTimeString();
    const [time] = value.split(" ");
    if (!time || time.match(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/) === null) {
        return "00:00:00";
    }
    return time;
};

const getCurrentTimeZone = (date = new Date()): string | null => {
    const value = date.toTimeString();
    const matches = value.match(/GMT([+-][0-9]{4})/);
    if (!matches) {
        return null;
    }
    const tz = matches[1];
    return `${tz.slice(0, 3)}:${tz.slice(3)}`;
};

const getHHmm = (time?: string) => {
    if (!time) {
        return "";
    }
    return time.split(":").slice(0, 2).join(":");
};

const getHHmmss = (time?: string) => {
    const parsable = time || getCurrentLocalTime();
    const parts = [...parsable.split(":").slice(0, 2), "00"];
    return parts.join(":");
};

const DateOnlyInput = createFieldRenderer(({ field }) => {
    return (
        <Input
            value={(field.value as string) || ""}
            onChange={value => field.onChange(value || "")}
            disabled={field.disabled}
            placeholder={field.placeholder}
            type="date"
            label={null}
        />
    );
});

const TimeInput = createFieldRenderer(({ field }) => {
    return (
        <Input
            value={getHHmm((field.value as string) || "")}
            onChange={value => {
                if (!value) {
                    field.onChange("");
                    return;
                }
                field.onChange(getHHmmss(value as string));
            }}
            disabled={field.disabled}
            placeholder={field.placeholder}
            type="time"
            label={null}
        />
    );
});

const DateTimeWithoutTimezoneInput = createFieldRenderer(({ field }) => {
    const raw = (field.value as string) || "";
    let date = "";
    let time = "";

    if (raw.includes("T")) {
        const [d, t] = raw.split(".")[0].split("T");
        date = d;
        time = t;
    } else if (raw.includes(" ")) {
        const [d, t] = raw.split(" ");
        date = d;
        time = t;
    }

    return (
        <Grid>
            <Grid.Column span={6}>
                <Input
                    value={date}
                    onChange={value => {
                        if (!value) {
                            field.onChange("");
                            return;
                        }
                        field.onChange(`${value} ${getHHmmss(time)}`);
                    }}
                    disabled={field.disabled}
                    type="date"
                    label={null}
                />
            </Grid.Column>
            <Grid.Column span={6}>
                <Input
                    value={getHHmm(time)}
                    onChange={value => {
                        if (!value) {
                            field.onChange("");
                            return;
                        }
                        field.onChange(`${date || getCurrentDate()} ${getHHmmss(value as string)}`);
                    }}
                    disabled={field.disabled}
                    type="time"
                    label={null}
                />
            </Grid.Column>
        </Grid>
    );
});

const DateTimeWithTimezoneInput = createFieldRenderer(({ field }) => {
    const defaultTz = getCurrentTimeZone() || DEFAULT_TIMEZONE;
    const raw = (field.value as string) || "";
    let date = "";
    let time = "";
    let timezone = defaultTz;

    if (raw.includes("T")) {
        const [d, rest] = raw.split("T");
        date = d;
        if (rest) {
            const sign = rest.includes("+") ? "+" : "-";
            const [t, tz] = rest.split(sign);
            time = t;
            timezone = sign + tz;
        }
    }

    return (
        <Grid>
            <Grid.Column span={4}>
                <Input
                    value={date}
                    onChange={value => {
                        if (!value) {
                            field.onChange("");
                            return;
                        }
                        field.onChange(`${value}T${getHHmmss(time)}${timezone}`);
                    }}
                    disabled={field.disabled}
                    type="date"
                    label={null}
                />
            </Grid.Column>
            <Grid.Column span={4}>
                <Input
                    value={getHHmm(time)}
                    onChange={value => {
                        if (!value) {
                            field.onChange("");
                            return;
                        }
                        field.onChange(
                            `${date || getCurrentDate()}T${getHHmmss(value as string)}${timezone}`
                        );
                    }}
                    disabled={field.disabled}
                    type="time"
                    label={null}
                />
            </Grid.Column>
            <Grid.Column span={4}>
                <Select
                    value={timezone}
                    onChange={value => {
                        if (!value) {
                            field.onChange("");
                            return;
                        }
                        field.onChange(
                            `${date || getCurrentDate()}T${time || getCurrentLocalTime()}${value}`
                        );
                    }}
                    disabled={field.disabled}
                    options={UTC_TIMEZONES.map(t => ({ value: t.value, label: t.label }))}
                />
            </Grid.Column>
        </Grid>
    );
});

export const DateTimeRenderer = createFieldRenderer<"dateTimeInput">(({ field }) => {
    const type = field.rendererSettings?.type ?? "date";

    let Component: React.ComponentType<{ field: IFieldVM }>;
    switch (type) {
        case "dateTimeWithoutTimezone":
            Component = DateTimeWithoutTimezoneInput;
            break;
        case "dateTimeWithTimezone":
            Component = DateTimeWithTimezoneInput;
            break;
        case "time":
            Component = TimeInput;
            break;
        default:
            Component = DateOnlyInput;
            break;
    }

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={field.label}
                required={field.required}
                disabled={field.disabled}
            />
            {field.description && <FormComponentDescription text={field.description} />}
            <Component field={field} />
            <FormComponentNote text={field.note} disabled={field.disabled} />
        </div>
    );
});
