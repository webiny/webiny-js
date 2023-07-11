import React from "react";
import { Property } from "@webiny/react-properties";
import { useModel } from "~/admin/hooks";

export interface FiltersToWhereConverter {
    (filters: Record<string, any>): Record<string, any>;
}

export interface FiltersToWhereProps {
    converter: FiltersToWhereConverter;
    modelIds?: string[];
}

export const FiltersToWhere = ({ converter, modelIds = [] }: FiltersToWhereProps) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <Property id="browser" name={"browser"}>
            <Property name={"filtersToWhere"} array={true} value={converter} />
        </Property>
    );
};
