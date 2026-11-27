import React from "react";
import { DataListModels } from "./Model/index.js";
import type { ImportGroupData, ImportModelData } from "../types.js";

interface GroupProps {
    group: Pick<ImportGroupData, "id" | "name">;
}

const Group = ({ group }: GroupProps) => {
    return <h3 className={"text-[16px]"}>{group.name || group.id}</h3>;
};

interface DataListGroupProps {
    group: Pick<ImportGroupData, "id" | "name">;
    models: ImportModelData[];
}

export const DataListGroup = ({ group, models }: DataListGroupProps) => {
    return (
        <div className={"mt-sm-plus p-sm-plus"}>
            <Group group={group} />
            <DataListModels models={models} />
        </div>
    );
};
