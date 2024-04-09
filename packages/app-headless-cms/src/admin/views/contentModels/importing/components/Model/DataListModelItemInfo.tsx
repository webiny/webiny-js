import React from "react";
import styled from "@emotion/styled";
import { ImportModelData } from "~/admin/views/contentModels/importing/types";

const Text = styled("p")({
    fontSize: "9px",
    lineHeight: "10px",
    display: "block",
    padding: "0",
    margin: "0"
});

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

    return <Text>{getText(action)}</Text>;
};
