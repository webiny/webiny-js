import React, { useEffect, useMemo, useState } from "react";
import { Select } from "@webiny/admin-ui";
import type { FormComponentProps } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ListModelGroupsFeature } from "~/features/modelGroup/listModelGroups/feature.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";

export default function GroupSelect({ value, ...props }: FormComponentProps) {
    const { useCase } = useFeature(ListModelGroupsFeature);
    const [groups, setGroups] = useState<ModelGroupDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        useCase
            .execute()
            .then(setGroups)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const options = useMemo(() => {
        return groups.map(item => ({ value: item.slug, label: item.name }));
    }, [groups]);

    const selectValue = typeof value === "string" ? value : value.slug;

    return (
        <Select
            {...props}
            value={loading ? "" : selectValue}
            label={"Content model group"}
            options={options}
        />
    );
}
