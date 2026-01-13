import React, { useMemo } from "react";
import { Select } from "@webiny/ui/Select/index.js";
import type { FormComponentProps } from "@webiny/ui/types.js";
import type { ListMenuCmsGroupsQueryResponse } from "~/admin/viewsGraphql.js";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql.js";
import { useQuery } from "~/admin/hooks/index.js";

export default function GroupSelect({ value, ...props }: FormComponentProps) {
    const { data, loading } = useQuery<ListMenuCmsGroupsQueryResponse>(
        LIST_MENU_CONTENT_GROUPS_MODELS
    );

    const groups = loading || !data ? [] : data.listContentModelGroups.data;
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
