import React from "react";
import type { ImportModelData } from "../../types.js";

const getText = (action?: string | null) => {
    if (action === "create") {
        return `Model will be created.`;
    } else if (action === "update") {
        return `Model will be updated.`;
    } else if (action === "code") {
        return "Model cannot be updated because it was created via code.";
    }
    return `Unknown action: ${action}`;
};

interface DataListModelItemInfoProps {
    model: ImportModelData;
}

export const DataListModelItemInfo = ({ model }: DataListModelItemInfoProps) => {
    const { action } = model;

    return <p className={"block text-[9px] leading-[10px] p-0 m-0"}>{getText(action)}</p>;
};
