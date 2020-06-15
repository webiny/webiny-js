import React from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";

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
/**
 * @returns Current date string in format `YYYY-MM-DD`
 */
export const getCurrentDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // months start from 0
    const formattedMonth = month < 10 ? `0${month}` : month;
    const date = today.getDate();
    return `${year}-${formattedMonth}-${date}`;
};
/**
 *
 * @param {Object} label - I18NString instance
 * @param {String} text - text to append
 *
 * @return new updated instance of I18NString
 */
export const appendTextToLabel = (label, text) => {
    return { values: label.values.map(el => ({ ...el, value: `${el.value}${text}` })) };
};

export const DEFAULT_TIME = "00:00:00";
export const DEFAULT_DATE = getCurrentDateString();
export const DEFAULT_TIMEZONE = "+01:00";

const deleteIconStyles = css({
    width: "100% !important",
    height: "100% !important",
    color: "var(--mdc-theme-text-secondary-on-background) !important"
});

export const RemoveFieldButton = ({ trailingIcon }) => {
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
