import React from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { CmsModelField } from "~/types";

export const DEFAULT_TIMEZONE = "+01:00";

export const getDefaultFieldValue = (
    field: CmsModelField,
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

export const getHHmm = (time?: string) => {
    if (!time) {
        return "";
    }
    const parsableTime = time || getCurrentLocalTime();
    return parsableTime.split(":").slice(0, 2).join(":");
};

// Ensure a valid HH:mm:ss string, ending with :00 for seconds.
export const getHHmmss = (time?: string) => {
    const parsableTime = time || getCurrentLocalTime();
    const parts = [...parsableTime.split(":").slice(0, 2), "00"];

    return parts.join(":");
};

const deleteIconStyles = css({
    width: "100% !important",
    height: "100% !important",
    color: "var(--mdc-theme-text-secondary-on-background) !important"
});

interface RemoveFieldButtonProps {
    trailingIcon: any;
}
export const RemoveFieldButton = ({ trailingIcon }: RemoveFieldButtonProps) => {
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
