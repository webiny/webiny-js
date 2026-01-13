import React from "react";
import { DataListGroup } from "./DataListGroup.js";
import type { ImportGroupData, ImportModelData } from "../types.js";
import { useImport } from "~/admin/views/contentModels/importing/useImport.js";

const getGroupModels = (group: ImportGroupData, models?: ImportModelData[] | null) => {
    if (!models) {
        return [];
    }
    return models.filter(model => model.group === group.slug);
};

export const DataList = () => {
    const { groups, models } = useImport();
    if (!groups) {
        return null;
    }
    return (
        <>
            {groups.map((group, index) => {
                return (
                    <DataListGroup
                        key={`group-${index}`}
                        group={group}
                        models={getGroupModels(group, models)}
                    />
                );
            })}
        </>
    );
};
