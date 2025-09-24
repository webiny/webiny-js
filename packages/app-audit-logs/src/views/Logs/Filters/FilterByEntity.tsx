import React, { useMemo } from "react";
import { useBind, useForm } from "@webiny/form";
import { Select } from "@webiny/ui/Select/index.js";
import { apps as auditLogsApps } from "@webiny/common-audit-logs";
import type { IFilterFormData } from "./types.js";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByEntity = () => {
    const { data, setValue } = useForm<IFilterFormData>();
    const bind = useBind({
        name: "entity",
        beforeChange(value, cb) {
            setValue("action", undefined);
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        if (!data.app) {
            return [];
        }

        const entities = auditLogsApps.find(app => app.app === data.app)?.entities || [];

        return [
            { label: "All", value: "all" },
            ...entities.map(entity => ({ label: entity.displayName, value: entity.type }))
        ];
    }, [data.app]);

    if (options.length === 0) {
        return null;
    }

    return <Select {...bind} size={"medium"} placeholder={"Filter by Entity"} options={options} />;
};
