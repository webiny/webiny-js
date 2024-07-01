import React from "react";
import { useModel } from "~/admin/components/ModelProvider";

export interface IsApplicableToCurrentModelProps {
    modelIds: string[];
    children: React.ReactNode;
}

export const IsApplicableToCurrentModel = ({
    modelIds,
    children
}: IsApplicableToCurrentModelProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return <>{children}</>;
};
