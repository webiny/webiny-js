import React from "react";

import { useBind, useForm } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { auditLogsApps } from "@webiny/api-audit-logs/config";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByApp: React.FC = () => {
    const { setValue } = useForm();
    const bind = useBind({
        name: "data.app",
        beforeChange(value, cb) {
            setValue("data.entity", undefined);
            setValue("data.action", undefined);
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
