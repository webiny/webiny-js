import React, { useMemo } from "react";
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

export const FilterByAction = () => {
    const { data } = useForm<IFilterFormData>();
    const bind = useBind({
        name: "action",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        if (!data.app) {
            return [];
        }

        const entities = auditLogsApps.find(app => app.app === data.app)?.entities || [];
        const actions = entities.find(entity => entity.type === data.entity)?.actions || [];

        return [
            { label: "All", value: "all" },
            ...actions.map(entity => ({ label: entity.displayName, value: entity.type }))
        ];
    }, [data]);

    if (!data.app || !data.entity) {
        return null;
    }

    return <Select {...bind} size={"medium"} placeholder={"Filter by Action"} options={options} />;
};
