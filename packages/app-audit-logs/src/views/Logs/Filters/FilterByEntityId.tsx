import React from "react";
import { useBind, useForm } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
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
            const { id, version } = parseIdentifier(value);
            setValue("version", version || undefined);
            cb(id);
        }
    });

    return <Input {...bind} size={"medium"} placeholder={"Filter by EntityId"} />;
};
