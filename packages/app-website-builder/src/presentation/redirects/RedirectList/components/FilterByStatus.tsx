import React, { useMemo } from "react";
import { Select } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";

const getValidFilterValue = (value: string): boolean | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value === "true";
};

export const FilterByStatus = () => {
    const bind = useBind({
        name: "isEnabled",
        defaultValue: "all",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        return [
            { label: "All", value: "all" },
            { label: "Enabled", value: "true" },
            { label: "Disabled", value: "false" }
        ];
    }, []);

    return (
        <Select
            {...bind}
            value={String(bind.value)}
            size={"md"}
            placeholder={"Filter by status"}
            options={options}
            displayResetAction={false}
        />
    );
};
