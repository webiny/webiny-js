import React, { useMemo } from "react";
import { Select } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByStatus = () => {
    const bind = useBind({
        name: "status",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        return [
            { label: "All", value: "all" },
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Unpublished", value: "unpublished" }
        ];
    }, []);

    return (
        <Select
            {...bind}
            value={bind.value}
            size={"md"}
            placeholder={"Filter by status"}
            options={options}
        />
    );
};
