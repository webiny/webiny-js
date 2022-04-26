import React from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { CmsEditorField } from "~/types";

export const UTC_TIMEZONES = [
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

export const DEFAULT_TIMEZONE = "+01:00";

export const getDefaultFieldValue = (
    field: CmsEditorField,
    bind: {
        value: string | null | undefined;
    },
    getCurrent: () => string
): string => {
    const def = field.settings ? field.settings.defaultSetValue || "null" : "null";
    if (bind.value || def !== "current") {
        return bind.value || "";
    }
    return getCurrent();
};

export const getCurrentTimeZone = (date?: Date): string | null => {
    if (!date) {
        date = new Date();
    }
    const value = date.toTimeString();

    const matches = value.match(/GMT([+-][0-9]{4})/);
    if (!matches) {
        return null;
    }
    const timezone = matches[1];
    return `${timezone.slice(0, 3)}:${timezone.slice(3)}`;
};

export const getCurrentLocalTime = (date?: Date): string => {
    if (!date) {
        date = new Date();
    }
    const value = date.toTimeString();

    const [time] = value.split(" ");
    if (!time || time.match(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/) === null) {
        return "00:00:00";
    }
    return time;
};

export const getCurrentDate = (date?: Date): string => {
    if (!date) {
        date = new Date();
    }
    const year = String(date.getFullYear()).padStart(4, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const deleteIconStyles = css({
    width: "100% !important",
    height: "100% !important",
    color: "var(--mdc-theme-text-secondary-on-background) !important"
});

interface RemoveFieldButtonProps {
    // TODO @ts-refactor figure out correct trailing icon type
    // @ts-ignore
    trailingIcon: any;
}
export const RemoveFieldButton: React.FC<RemoveFieldButtonProps> = ({ trailingIcon }) => {
    if (!trailingIcon) {
        return null;
    }
    return (
        <Cell span={1}>
            <IconButton
                className={deleteIconStyles}
                onClick={trailingIcon.onClick}
                icon={trailingIcon.icon}
            />
        </Cell>
    );
};
