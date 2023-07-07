import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { mdbid } from "@webiny/utils";

export interface FiltersToWhereConverter {
    (filters: Record<string, any>): Record<string, any>;
}

export const FiltersToWhere = ({ converter }: { converter: FiltersToWhereConverter }) => {
    const getId = useIdGenerator("filtersToWhere");

    return (
        <Property id="browser" name={"browser"}>
            <Property id={getId(mdbid())} name={"filtersToWhere"} array={true} value={converter} />
        </Property>
    );
};
