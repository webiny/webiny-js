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

export const FilterByAction: React.FC = () => {
    const { data } = useForm();
    const bind = useBind({
        name: "data.action",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const appValue = data?.data?.app;
    const entityValue = data?.data?.entity;

    const options = useMemo(() => {
        if (!appValue || !entityValue) {
            return [];
        }

        const entities = auditLogsApps.find(app => app.app === appValue)?.entities || [];
        const actions = entities.find(entity => entity.type === entityValue)?.actions || [];

        return [
            { label: "All", value: "all" },
            ...actions.map(entity => ({ label: entity.displayName, value: entity.type }))
        ];
    }, [appValue, entityValue]);

    if (!appValue || !entityValue) {
        return null;
    }

    return <Select {...bind} size={"medium"} placeholder={"Filter by Action"} options={options} />;
};
