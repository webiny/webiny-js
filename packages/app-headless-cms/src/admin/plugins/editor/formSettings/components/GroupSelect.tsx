import React, { useMemo } from "react";
import { Select } from "@webiny/ui/Select";
import { FormComponentProps } from "@webiny/ui/types";
import {
    LIST_MENU_CONTENT_GROUPS_MODELS,
    ListMenuCmsGroupsQueryResponse
} from "~/admin/viewsGraphql";
import { useQuery } from "~/admin/hooks";

export default function GroupSelect({ value, ...props }: FormComponentProps) {
    const { data, loading } = useQuery<ListMenuCmsGroupsQueryResponse>(
        LIST_MENU_CONTENT_GROUPS_MODELS
    );

    const groups = loading || !data ? [] : data.listContentModelGroups.data;
    const options = useMemo(() => {
        return groups.map(item => ({ value: item.id, label: item.name }));
    }, [groups]);

    const selectValue = typeof value === "string" ? value : value.id;

    return (
        <Select
            {...props}
            value={loading ? "" : selectValue}
            label={"Content model group"}
            options={options}
        />
    );
}
