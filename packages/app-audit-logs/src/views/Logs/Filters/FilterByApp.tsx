import React from "react";
import { useBind, useForm } from "@webiny/form";
import { Select } from "@webiny/ui/Select/index.js";
import { apps as auditLogsApps } from "@webiny/common-audit-logs";
import type { IFilterFormData } from "~/views/Logs/Filters/types.js";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByApp = () => {
    const { setValue } = useForm<IFilterFormData>();
    const bind = useBind({
        name: "app",
        beforeChange(value, cb) {
            setValue("entity", undefined);
            setValue("action", undefined);
            cb(getValidFilterValue(value));
        }
    });

    return (
        <Select
            {...bind}
            size={"medium"}
            placeholder={"Filter by App"}
            options={[
                { label: "All", value: "all" },
                ...auditLogsApps.map(app => ({ label: app.displayName, value: app.app }))
            ]}
        />
    );
};
