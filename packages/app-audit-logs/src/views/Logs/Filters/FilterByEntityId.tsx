import React from "react";
import { useBind, useForm } from "@webiny/form";
import { Input } from "@webiny/ui/Input/index.js";
import type { IFilterFormData } from "~/views/Logs/Filters/types.js";

export const FilterByEntityId = () => {
    const { setValue } = useForm<IFilterFormData>();
    const bind = useBind({
        name: "entityId",
        beforeChange(value, cb) {
            if (!value) {
                cb(undefined);
                return;
            }
            setValue("app", undefined);
            setValue("entity", undefined);
            setValue("action", undefined);
            setValue("createdBy", undefined);
            cb(value);
        }
    });

    return <Input {...bind} size={"medium"} placeholder={"Filter by EntityId"} />;
};
