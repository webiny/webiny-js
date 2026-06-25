import React from "react";
import { Property } from "@webiny/react-properties";

export interface FiltersToWhereConverter {
    (filters: Record<string, any>): Record<string, any>;
}

export const FiltersToWhere = ({ converter }: { converter: FiltersToWhereConverter }) => {
    return (
        <Property id="browser" name={"browser"}>
            <Property name={"filtersToWhere"} array={true} value={converter} />
        </Property>
    );
};
