import React from "react";
import { DatePicker } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";

const now = new Date();

export const FilterByCreatedOn = () => {
    const bindFrom = useBind({
        name: "createdOn_gte"
    });

    const bindTo = useBind({
        name: "createdOn_lte"
    });

    return (
        <div className={"flex flex-col gap-md"}>
            <DatePicker
                label={"Created from"}
                type="dateTimeLocal"
                value={bindFrom.value ?? undefined}
                onChange={value => {
                    bindFrom.onChange(value ?? undefined);
                }}
                placeholder="Select date"
                size="md"
                maxDate={now}
            />
            <DatePicker
                label={"Created to"}
                type="dateTimeLocal"
                value={bindTo.value ?? undefined}
                onChange={value => {
                    bindTo.onChange(value ?? undefined);
                }}
                placeholder="Select date"
                size="md"
                maxDate={now}
            />
        </div>
    );
};
