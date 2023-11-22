import React, { useMemo } from "react";

import { useBind, useForm } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { auditLogsApps } from "@webiny/api-audit-logs/config";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByEntity: React.FC = () => {
    const { data, setValue } = useForm();
    const bind = useBind({
        name: "data.entity",
        beforeChange(value, cb) {
            setValue("data.action", undefined);
            cb(getValidFilterValue(value));
        }
    });

    const appValue = data?.data?.app;

    const options = useMemo(() => {
        if (!appValue) {
            return [];
        }

        const entities = auditLogsApps.find(app => app.app === appValue)?.entities || [];

        return [
            { label: "All", value: "all" },
            ...entities.map(entity => ({ label: entity.displayName, value: entity.type }))
        ];
    }, [appValue]);

    if (!appValue) {
        return null;
    }

    return <Select {...bind} size={"medium"} placeholder={"Filter by Entity"} options={options} />;
};
