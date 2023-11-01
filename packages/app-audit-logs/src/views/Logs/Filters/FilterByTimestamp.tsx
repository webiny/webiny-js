import React from "react";
import { format } from "date-fns";

import { Input } from "@webiny/ui/Input";
import { useBind } from "@webiny/form";

import { TimestampFiltersContainer } from "./styled";

const formatDateTime = (date: string) => {
    if (!date) {
        return "";
    }

    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
};

const getValidFilterValue = (value: string): Date | undefined => {
    if (value === "") {
        return undefined;
    }

    return new Date(value);
};

export const FilterByTimestamp: React.FC = () => {
    const bindFrom = useBind({
        name: "data.timestamp_gte",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const bindTo = useBind({
        name: "data.timestamp_lte",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    return (
        <TimestampFiltersContainer>
            <Input {...bindFrom} value={formatDateTime(bindFrom.value)} type="datetime-local" />
            <Input {...bindTo} value={formatDateTime(bindTo.value)} type="datetime-local" />
        </TimestampFiltersContainer>
    );
};
